import { StoriesController } from './stories.controller';
import { StoriesService } from '../services/stories.service';

describe('StoriesController', () => {
  let controller: StoriesController;
  let service: jest.Mocked<StoriesService>;

  const mockStory = {
    id: '01HVG7J0000000000000000010',
    creatorId: '01HVG7J0000000000000000001',
    title: 'The Quantum Divergence',
    synopsis: 'A gripping sci-fi narrative',
    status: 'DRAFT',
    language: 'en',
    viewCount: 120,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    service = {
      getFeed: jest.fn(),
      getFeatured: jest.fn(),
      getStoryById: jest.fn(),
      createDraft: jest.fn(),
      updateStory: jest.fn(),
      deleteStory: jest.fn(),
      publishStory: jest.fn(),
    } as any;

    controller = new StoriesController(service);
  });

  it('should return wrapped feed response', async () => {
    service.getFeed.mockResolvedValue({
      items: [mockStory as any],
      total: 1,
      page: 1,
      limit: 20,
    });

    const response = await controller.getFeed({ page: 1 });
    expect(response.success).toBe(true);
    expect(response.data.length).toBe(1);
    expect(response.meta?.total).toBe(1);
  });

  it('should return wrapped story detail response', async () => {
    service.getStoryById.mockResolvedValue(mockStory as any);

    const response = await controller.getStoryById(mockStory.id);
    expect(response.success).toBe(true);
    expect(response.data.id).toBe(mockStory.id);
  });

  it('should return wrapped draft creation response', async () => {
    service.createDraft.mockResolvedValue(mockStory as any);

    const mockUser = { id: '01HVG7J0000000000000000002', displayName: 'Creator' } as any;
    const response = await controller.createDraft(mockUser, {
      title: 'New Story',
      synopsis: 'Synopsis',
    });

    expect(response.success).toBe(true);
    expect(response.data.title).toBe(mockStory.title);
  });

  it('should return wrapped publish response', async () => {
    service.publishStory.mockResolvedValue({ ...mockStory, status: 'PUBLISHED' } as any);

    const response = await controller.publishStory(mockStory.id);
    expect(response.success).toBe(true);
    expect(response.data.status).toBe('PUBLISHED');
  });
});
