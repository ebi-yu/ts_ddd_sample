import { Dependency } from 'hono-simple-di';
import { CreateArticleUseCase } from './application/CreateArticleUseCase.ts';
import { DeleteArticleUseCase } from './application/DeleteArticleUseCase.ts';
import { SearchArticleUseCase } from './application/SearchArticleUseCase.ts';
import { ArticleController } from './infrastructure/http/controller/ArticleController.ts';
import { createKafkaDomainEventPublisher } from './infrastructure/messaging/index.ts';
import { ArticleEventCommandRepository } from './infrastructure/persistence/ArticleEventCommandRepository.ts';
import { ArticleReadModelQuery } from './infrastructure/readmodel/ArticleReadModelQuery.ts';

export const articleDependencies = () => {
  const articleEventRepositoryDep = new Dependency(() => new ArticleEventCommandRepository());
  const articleReadModelQueryDep = new Dependency(() => new ArticleReadModelQuery());
  const domainEventPublisherDep = new Dependency(() => createKafkaDomainEventPublisher());

  const createArticleUseCaseDep = new Dependency(async (c) => {
    const articleEventCommandRepository = await articleEventRepositoryDep.resolve(c);
    const domainEventPublisher = await domainEventPublisherDep.resolve(c);
    return new CreateArticleUseCase(articleEventCommandRepository, domainEventPublisher);
  });

  const searchArticleUseCaseDep = new Dependency(async (c) => {
    const articleReadModelQuery = await articleReadModelQueryDep.resolve(c);
    return new SearchArticleUseCase(articleReadModelQuery);
  });

  const deleteArticleUseCaseDep = new Dependency(async (c) => {
    const articleEventCommandRepository = await articleEventRepositoryDep.resolve(c);
    return new DeleteArticleUseCase(articleEventCommandRepository);
  });

  const articleControllerDep = new Dependency(
    async (c) => {
      const createArticleUseCase = await createArticleUseCaseDep.resolve(c);
      const searchArticleUseCase = await searchArticleUseCaseDep.resolve(c);
      const deleteArticleUseCase = await deleteArticleUseCaseDep.resolve(c);
      return new ArticleController(
        createArticleUseCase,
        searchArticleUseCase,
        deleteArticleUseCase,
      );
    },
    { scope: 'request' },
  );

  return {
    articleControllerDep,
  };
};
