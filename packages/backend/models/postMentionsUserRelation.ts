import { sequelize } from "./sequelize.js";

const PostMentionsUserRelation = sequelize.define(
  'postMentionsUserRelations',
  {},
  {
    indexes: [
      {
        // unique: true,
        fields: [
          {
            attribute: 'postId'
          }
        ]
      },
      {
        unique: false,
        fields: ['userId']
      }
    ]
  }
)

export default PostMentionsUserRelation
