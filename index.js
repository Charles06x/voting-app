const { GraphQLServer } = require('graphql-yoga');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const typeDefs = `
    type User {
        id          :ID!
        name        :String!
        polls       :[Poll]
    }

    type Poll {
        id          :ID!
        description :String!
        user        :User!
        options     :[Option]
        votes       :[Vote]
    }

    type Option {
        id          :ID!
        text        :String!
        polls       :Poll!
        votes       :[Vote]
    }

    type Vote {
        id          :ID!
        user        :User!
        poll        :Poll!
        option      :Option!
    }

    type Query {
        users: [User]
        polls: [Poll]
        votes: [Vote]
        user(id: ID!): User
        poll(id: ID!): Poll
    }

    type Mutation {
        createUser(
            name: String!
        ): User

        createPoll(
            description: String!
            id: ID!
            options: [String!]
        ): Poll

        createVote(
            userId: ID!
            pollId: ID!
            optionId: ID!
        ): Vote
    }
`

const resolvers = {
  Query: {
    user: async (parent, args, context) => {
        const { id } = args;
        return context.prisma.user.findOne({
            where: {
                id
            },
            include: { polls: true }
        })
    },

    users: async (parent, args, context) => {
        return context.prisma.user.findMany({                
            include: {polls: true}
        })
    }
    // hello: (_, { name }) => `Hello ${name || 'World'}`,
  },
  Mutation: {
      createUser: (parent, args, context, info) => {
        const newUser = context.prisma.user.create({
            data: {
                name: args.name
            }
        });

        return newUser
      }
  }
}

const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

const server = new GraphQLServer({
  schema,
  context: {
    prisma
  }
})

const options = {
  port: 8000,
  endpoint: '/graphql',
  subscriptions: '/subscriptions',
  playground: '/playground',
}
server.start(options, ({ port }) =>
  console.log(
    `Server started, listening on port ${port} for incoming requests.`,
  ),
)