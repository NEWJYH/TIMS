import { GraphQLError } from 'graphql';
import { winstonLogger } from 'src/commons/logger/winston.config';

export const gqlFormatError = (error: GraphQLError): GraphQLError => {
  const code = error.extensions?.code as string;

  if (code === 'GRAPHQL_VALIDATION_FAILED' || code === 'GRAPHQL_PARSE_FAILED') {
    const errorDetails = {
      path: error.path,
      locations: error.locations,
      code,
    };

    winstonLogger.warn(
      `[GraphQL Validation] ${error.message} - ${JSON.stringify(errorDetails)}`,
    );
  }

  return error;
};
