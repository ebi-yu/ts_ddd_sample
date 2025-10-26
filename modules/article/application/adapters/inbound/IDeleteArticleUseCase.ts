import type { DeleteArticleDtoType } from '../../dto/input/DeleteArticleDTO.ts';

export interface IDeleteArticleUseCase {
  execute(dto: DeleteArticleDtoType): Promise<void>;
}
