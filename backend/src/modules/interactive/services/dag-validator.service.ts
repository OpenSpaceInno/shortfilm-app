import { Injectable } from '@nestjs/common';
import { StoryNodesRepository } from '../repositories/story-nodes.repository';
import { ChoicesRepository } from '../repositories/choices.repository';
import { ChoiceOptionsRepository } from '../repositories/choice-options.repository';
import { GraphValidationResultDto } from '../dto/validation-result.dto';

interface AdjListEntry {
  nodeId: string;
  nodeType: string;
  isRoot: boolean;
  destinations: string[];
}

@Injectable()
export class DagValidatorService {
  constructor(
    private readonly storyNodesRepository: StoryNodesRepository,
    private readonly choicesRepository: ChoicesRepository,
    private readonly choiceOptionsRepository: ChoiceOptionsRepository,
  ) {}

  async validate(versionId: string): Promise<GraphValidationResultDto> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const nodes = await this.storyNodesRepository.findByVersionId(versionId);

    if (nodes.length === 0) {
      return {
        isValid: false,
        errors: ['STORY_GRAPH_EMPTY: Story version has no nodes'],
        warnings: [],
        stats: { nodeCount: 0, choiceCount: 0, endingCount: 0, maxDepth: 0 },
      };
    }

    const nodeMap = new Map<string, typeof nodes[0]>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    // 1. Root Node Check
    const rootNodes = nodes.filter((n) => n.isRoot);
    if (rootNodes.length === 0) {
      errors.push('STORY_GRAPH_NO_ROOT_NODE: Graph must have exactly one root node');
    } else if (rootNodes.length > 1) {
      errors.push(
        `STORY_GRAPH_MULTIPLE_ROOT_NODES: Found ${rootNodes.length} root nodes. Exactly one is allowed.`,
      );
    }

    const rootNode = rootNodes[0];

    // Build Adjacency List
    const adjMap = new Map<string, AdjListEntry>();
    let totalChoices = 0;

    for (const node of nodes) {
      const choice = await this.choicesRepository.findByNodeId(node.id);
      const destinations: string[] = [];

      if (choice) {
        totalChoices++;
        const options = await this.choiceOptionsRepository.findByChoiceId(choice.id);

        if (node.nodeType === 'CHOICE_POINT' && options.length < 2) {
          errors.push(
            `CHOICE_POINT_INCOMPLETE: Choice point node '${node.id}' must have at least 2 options (found ${options.length})`,
          );
        }

        for (const opt of options) {
          if (!nodeMap.has(opt.destinationNodeId)) {
            errors.push(
              `DESTINATION_NODE_INVALID: Choice option '${opt.id}' references destination node '${opt.destinationNodeId}' which does not exist in this version`,
            );
          } else {
            destinations.push(opt.destinationNodeId);
          }
        }
      }

      adjMap.set(node.id, {
        nodeId: node.id,
        nodeType: node.nodeType,
        isRoot: node.isRoot,
        destinations,
      });

      // 5. Ending Node Check
      if (node.nodeType === 'ENDING' && destinations.length > 0) {
        errors.push(
          `ENDING_NODE_HAS_CHOICES: Ending node '${node.id}' cannot have outbound choices or destination nodes`,
        );
      }

      if (destinations.length === 0 && node.nodeType !== 'ENDING') {
        errors.push(
          `DEAD_END_NODE: Node '${node.id}' has no outbound branches but nodeType is '${node.nodeType}' instead of 'ENDING'`,
        );
      }
    }

    // 2. DAG Cycle Detection (DFS with 3-color states: 0=WHITE, 1=GREY, 2=BLACK)
    const color = new Map<string, number>();
    nodes.forEach((n) => color.set(n.id, 0));

    let cycleFound = false;

    const dfsCycle = (u: string) => {
      color.set(u, 1); // Grey: visiting

      const entry = adjMap.get(u);
      if (entry) {
        for (const v of entry.destinations) {
          if (color.get(v) === 1) {
            cycleFound = true;
            errors.push(
              `STORY_GRAPH_CYCLE_DETECTED: Graph contains a directed cycle involving node '${v}'`,
            );
          } else if (color.get(v) === 0) {
            dfsCycle(v);
          }
        }
      }

      color.set(u, 2); // Black: visited
    };

    if (rootNode) {
      dfsCycle(rootNode.id);
    }

    // Also run on any disconnected components to catch cycles in disconnected parts
    for (const node of nodes) {
      if (color.get(node.id) === 0) {
        dfsCycle(node.id);
      }
    }

    // 3. Reachability Check (Nodes reachable from root node)
    const visitedFromRoot = new Set<string>();
    const dfsReach = (u: string) => {
      visitedFromRoot.add(u);
      const entry = adjMap.get(u);
      if (entry) {
        for (const v of entry.destinations) {
          if (!visitedFromRoot.has(v)) {
            dfsReach(v);
          }
        }
      }
    };

    if (rootNode) {
      dfsReach(rootNode.id);
    }

    const unreachable = nodes.filter((n) => !visitedFromRoot.has(n.id));
    if (unreachable.length > 0) {
      warnings.push(
        `STORY_GRAPH_UNREACHABLE_NODES: ${unreachable.length} node(s) cannot be reached from root node: [${unreachable.map((n) => n.id).join(', ')}]`,
      );
    }

    // 6. Max Depth Calculation
    let maxDepth = 0;
    if (rootNode && !cycleFound) {
      const depthMemo = new Map<string, number>();

      const getDepth = (u: string): number => {
        if (depthMemo.has(u)) return depthMemo.get(u)!;
        const entry = adjMap.get(u);
        if (!entry || entry.destinations.length === 0) {
          return 1;
        }
        let maxChild = 0;
        for (const v of entry.destinations) {
          maxChild = Math.max(maxChild, getDepth(v));
        }
        const depth = 1 + maxChild;
        depthMemo.set(u, depth);
        return depth;
      };

      maxDepth = getDepth(rootNode.id);
    }

    const endingNodes = nodes.filter((n) => n.nodeType === 'ENDING');

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats: {
        nodeCount: nodes.length,
        choiceCount: totalChoices,
        endingCount: endingNodes.length,
        maxDepth,
      },
    };
  }
}
