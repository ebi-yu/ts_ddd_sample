import type { CreateArticleDtoType } from '../../dto/input/CreateArticleDTO.ts';

export interface ICreateArticleUseCase {
  execute(article: CreateArticleDtoType): Promise<string>;
}
