import { Dependency } from 'hono-simple-di';
import { CreateArticleUseCase } from './application/CreateArtucleUseCase.ts';
import { SearchArticleUseCase } from './application/SearchArticleUseCase.ts';
import { ArticleController } from './infrastructure/controller/ArticleController.ts';
import { createKafkaDomainEventPublisher } from './infrastructure/domain_event/index.ts';
import { ArticleReadModelQuery } from './infrastructure/readmodel/ArticleReadModelQuery.ts';
import { ArticleEventRepository } from './infrastructure/repository/ArticleEventRepository.ts';

export const articleDependencies = () => {
  const articleEventRepositoryDep = new Dependency(() => new ArticleEventRepository());
  const articleReadModelQueryDep = new Dependency(() => new ArticleReadModelQuery());
  const domainEventPublisherDep = new Dependency(() => createKafkaDomainEventPublisher());

  const createArticleUseCaseDep = new Dependency(async (c) => {
    const articleRepository = await articleEventRepositoryDep.resolve(c);
    const domainEventPublisher = await domainEventPublisherDep.resolve(c);
    return new CreateArticleUseCase(articleRepository, domainEventPublisher);
  });

  const searchArticleUseCaseDep = new Dependency(async (c) => {
    const articleReadModelQuery = await articleReadModelQueryDep.resolve(c);
    return new SearchArticleUseCase(articleReadModelQuery);
  });

  const articleControllerDep = new Dependency(
    async (c) => {
      const createArticleUseCase = await createArticleUseCaseDep.resolve(c);
      const searchArticleUseCase = await searchArticleUseCaseDep.resolve(c);
      return new ArticleController(createArticleUseCase, searchArticleUseCase);
    },
    { scope: 'request' },
  );

  return {
    articleControllerDep,
  };
};
