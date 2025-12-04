import { GraphQLError } from 'graphql';
import { winstonLogger } from 'src/commons/logger/winston.config';

export const gqlFormatError = (error: GraphQLError): GraphQLError => {
  const code = error.extensions?.code as string;

  if (code === 'GRAPHQL_VALIDATION_FAILED' || code === 'GRAPHQL_PARSE_FAILED') {
    winstonLogger.warn(`[GraphQL Validation] ${error.message}`, {
      path: error.path,
      locations: error.locations,
      code,
    });
  }

  return error;
};
