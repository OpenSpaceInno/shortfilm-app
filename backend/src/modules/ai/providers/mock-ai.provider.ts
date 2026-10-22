import { Injectable, Logger } from '@nestjs/common';
import { AiProvider, AiCompletionRequest, AiCompletionResponse } from '../interfaces/ai-provider.interface';

@Injectable()
export class MockAiProvider implements AiProvider {
  private readonly logger = new Logger(MockAiProvider.name);
  readonly providerName = 'MOCK_PROVIDER';
  readonly defaultModel = 'mock-creative-sonnet-v1';

  async isHealthy(): Promise<boolean> {
    return true;
  }

  async generateStructured<T>(request: AiCompletionRequest): Promise<AiCompletionResponse<T>> {
    const startTime = Date.now();
    const prompt = (request.userPrompt || '').toLowerCase();
    let data: any;

    if (prompt.includes('concept') || prompt.includes('logline') || prompt.includes('premise')) {
      data = this.generateMockConcept(request.userPrompt);
    } else if (prompt.includes('character') || prompt.includes('forge')) {
      data = this.generateMockCharacters(request.userPrompt);
    } else if (prompt.includes('dilemma') || prompt.includes('branch') || prompt.includes('choice')) {
      data = this.generateMockDilemma(request.userPrompt);
    } else if (prompt.includes('cliffhanger') || prompt.includes('hook') || prompt.includes('tension')) {
      data = this.generateMockCliffhanger(request.userPrompt);
    } else if (prompt.includes('production pack') || prompt.includes('bible') || prompt.includes('series outline')) {
      data = this.generateMockProductionPack(request.userPrompt);
    } else {
      data = {
        title: 'Neon Odyssey',
        summary: 'An interactive vertical series.',
        response: 'AI generated response based on user prompt.',
      };
    }

    const latencyMs = Math.max(10, Date.now() - startTime);
    const promptTokens = Math.ceil((request.systemPrompt.length + request.userPrompt.length) / 4);
    const completionTokens = Math.ceil(JSON.stringify(data).length / 4);

    return {
      data: data as T,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      provider: this.providerName,
      model: this.defaultModel,
      latencyMs,
      rawText: JSON.stringify(data),
    };
  }

  private generateMockConcept(userPrompt: string) {
    return {
      title: 'Messages From Tomorrow',
      genre: 'Mystery · Romance',
      language: 'Hindi',
      format: 'Vertical Short Series (9:16 portrait)',
      episodes: 8,
      logline:
        'A young woman begins receiving voice notes from her future self warning her about decisions she has not yet made.',
      targetAudience: 'Young adults 18-30 seeking high-tension romantic thrillers',
      arc: [
        {
          label: 'Act I — The First Message',
          text: 'Maya dismisses the mysterious audio note until its prediction prevents a deadly crossroads collision.',
        },
        {
          label: 'Act II — The Cost of Knowing',
          text: 'Acting on future warnings alters the timeline in dangerous ways. Arjun begins suspecting Maya knows the impossible.',
        },
        {
          label: 'Act III — Tomorrow Calls Back',
          text: 'The final voice message demands Maya make an irreversible choice that might prevent her future self from ever existing.',
        },
      ],
      characters: [
        {
          name: 'Maya',
          age: 'Age 24',
          role: 'Protagonist',
          note: 'Night-shift systems architect, skeptic, driven by grief over her sister.',
        },
        {
          name: 'Arjun',
          age: 'Age 27',
          role: 'Love Interest / Investigator',
          note: 'Paramedic who mysteriously appears at every location Maya is warned about.',
        },
        {
          name: 'Riya',
          age: 'Age 25',
          role: 'Confidante',
          note: 'Tech journalist who attempts to trace the unroutable frequency.',
        },
      ],
    };
  }

  private generateMockCharacters(userPrompt: string) {
    return {
      characters: [
        {
          name: 'Dev Malhotra',
          age: '31',
          role: 'Protagonist / Disgraced Detective',
          coreDesire: 'Clear his family name before his terminal tremors take his hands.',
          fatalFlaw: 'Obsessive distrust of anyone offering help.',
          secret: 'He burned the original forensic log that could have exonerated him.',
          dialogueVoice: 'Cynical, rapid-fire Mumbai street Hindi, rarely asks questions.',
          visualCue: 'Wears an unbuckled leather chronograph set 5 minutes fast.',
        },
        {
          name: 'Ananya Roy',
          age: '26',
          role: 'Antagonist / Hacker Syndicate Leader',
          coreDesire: 'Force the city transit grid into public open source.',
          fatalFlaw: 'Overestimates her own moral detachment.',
          secret: 'Dev was her elder brother’s mentor.',
          dialogueVoice: 'Calm, whisper-soft, switches effortlessly between Bengali and English.',
          visualCue: 'Dual-tone neon acrylic nails tapping rhythmically on screens.',
        },
        {
          name: 'Kabir Qureshi',
          age: '45',
          role: 'Wildcard / Transit Superintendent',
          coreDesire: 'Survive to his retirement pension in 90 days.',
          fatalFlaw: 'Greed masked as bureaucratic obedience.',
          secret: 'Taking kickbacks to look away from unlisted maintenance railcars.',
          dialogueVoice: 'Polite, evasive, peppered with railway codes.',
          visualCue: 'Smells faintly of cardamom tea and cigarette smoke.',
        },
      ],
    };
  }

  private generateMockDilemma(userPrompt: string) {
    return {
      prompt: 'The subway power cuts out. Ananya drops her decryptor chip while Dev aims his firearm.',
      optionA: 'Retrieve Decryptor Chip from the live railway track',
      optionB: 'Tackle Ananya before she reaches the emergency exit hatch',
      consequenceA:
        'Dev secures the biometric cipher, but Ananya slips into the tunnel maze leaving him trapped.',
      consequenceB:
        'Dev apprehends Ananya, but the decryption key is crushed beneath the oncoming maintenance express.',
      tensionScore: 94,
      moralDilemmaAxis: 'Duty vs. Truth (Institutional Justice vs. Personal Exoneration)',
    };
  }

  private generateMockCliffhanger(userPrompt: string) {
    return {
      cliffhangerHook:
        'Maya plays the incoming voicemail on speaker. The speaker does not play her future self—it plays Arjun screaming from a location she is standing in right now.',
      visualFinalFrame:
        'Extreme macro close-up of Maya’s reflection in the cracked smartphone screen as the room lights plunge into black.',
      audioEndingCue:
        'Heavy sub-bass pulse dropping abruptly to silence, followed by the faint double-beep of a disconnected call.',
      urgencyLevel: 'CRITICAL',
      retentionTriggers: [
        'Audience identity disorientation',
        'Imminent character peril',
        'Subversion of established voice rule',
      ],
    };
  }

  private generateMockProductionPack(userPrompt: string) {
    return {
      title: 'Neon Karma 2099',
      genre: 'Cyberpunk · Thriller',
      language: 'Hinglish',
      episodesCount: 8,
      logline:
        'In a vertical Mumbai sky-corridor, an ethical memory hacker is hired to delete a crime she has not yet committed.',
      arc: [
        { label: 'Act I', text: 'The impossible contract is delivered on an encrypted neural drive.' },
        { label: 'Act II', text: 'Zara discovers the victim is her own childhood foster parent.' },
        { label: 'Act III', text: 'The countdown reaches zero at the annual monsoon solar eclipse.' },
      ],
      characters: [
        { name: 'Zara-7', role: 'Memory Hacker', age: '28', note: 'Neuro-augmented cyber operative.' },
        { name: 'Dr. Veer', role: 'Neurosurgeon', age: '54', note: 'Creator of the synthetic memory registry.' },
      ],
      episodeList: [
        {
          number: 1,
          title: 'The Uncommitted Crime',
          synopsis: 'Zara receives an escrow payment for a hit that hasn’t happened.',
          hook: 'A retinal scan reveals Zara’s own biometric signature at tomorrow’s crime scene.',
          cliffhanger: 'The target walks through Zara’s front door asking for sanctuary.',
          duration: '2m 10s',
          isChoicePoint: true,
        },
        {
          number: 2,
          title: 'Ghost In The Neural Net',
          synopsis: 'Zara scans Veer’s memory cortex to confirm if the contract is real.',
          hook: 'Veer has no memory of ever meeting Zara before tonight.',
          cliffhanger: 'Security drones breach the high-rise balcony.',
          duration: '1m 55s',
          isChoicePoint: false,
        },
      ],
      choices: [
        {
          episode: 1,
          prompt: 'Should Zara let Veer inside her apartment or lock the blast doors?',
          optionA: 'Open blast doors and let him in',
          optionB: 'Lock doors and trigger perimeter silent alarm',
          consequenceA: 'Veer reveals the syndicate dossier, but compromises Zara’s secret hideout.',
          consequenceB: 'Zara remains hidden, but Veer is apprehended by corporate enforcers.',
        },
      ],
      productionPack: [
        {
          title: 'Cinematography & Framing Guide',
          body: 'All scenes framed vertically at 9:16 (1080x1920). Use volumetric neon backlight (cyan & amber). Camera stays at eye level or low dutch angles to emphasize vertical skyscrapers.',
        },
        {
          title: 'Audio & Foley Notes',
          body: 'Heavy ambient vertical rain, distant mag-lev train hums, crisp mechanical keyboard clicks, and binaural heartbeat risers during choice decision moments.',
        },
      ],
    };
  }
}
