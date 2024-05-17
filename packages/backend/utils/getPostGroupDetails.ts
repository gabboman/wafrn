/* eslint-disable guard-for-in */
import { Post } from '../db'
import { Op } from 'sequelize'

export default async function getPosstGroupDetails(postGroup: any[]) {
  const getPostFirstParentId = (post: any) => {
    if (!post?.ancestors) {
      return post.id
    } else {
      let furthestDate = new Date()
      let id = post.id
      post.ancestors.forEach((ancestor: any) => {
        if (furthestDate > ancestor.createdAt) {
          furthestDate = ancestor.createdAt
          id = ancestor.id
        }
      })
      return id
    }
  }
  const postIds: string[] = postGroup.map((elem) => getPostFirstParentId(elem))
  // TODO optimize this! I feel like this might be more optimizable. This is one of those things
  const fullPostTree = await Post.findAll({
    where: {
      id: { [Op.in]: postIds }
    },
    attributes: ['id'],
    include: [
      {
        model: Post,
        as: 'descendents',
        attributes: ['id'],
        where: {
          privacy: {
            [Op.ne]: 10
          }
        }
      }
    ]
  })
  return postGroup.map((elem) => {
    let notes = 0
    fullPostTree.forEach((elementWithNotes: any) => {
      const idtoCheck = getPostFirstParentId(elem)
      if (idtoCheck === elementWithNotes.id) {
        notes = elementWithNotes.descendents.length
      }
    })
    return { ...elem.dataValues, notes }
  })
}
