import { Injectable } from '@nestjs/common';
import { GenresRepository } from '../repositories/genres.repository';
import { GenreResponseDto } from '../dto/genre-response.dto';

@Injectable()
export class GenresService {
  constructor(private readonly genresRepository: GenresRepository) {}

  async getAllGenres(): Promise<GenreResponseDto[]> {
    const genres = await this.genresRepository.findAll();
    return genres.map((g) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      icon: g.icon,
      createdAt: g.createdAt,
    }));
  }
}
