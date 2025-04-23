import { User } from '../../models/index.js'
import { environment } from '../../environment.js'

// I know its not redis cache but makes sense shut up
async function getDeletedUser() {
  return await User.findOne({
    where: {
      url: environment.deletedUser
    }
  })
}

export { getDeletedUser }
