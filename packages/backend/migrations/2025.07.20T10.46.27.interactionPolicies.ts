import { DataTypes, Sequelize, UUIDV4 } from 'sequelize'
import { Migration } from '../migrate.js'
import { FederatedHost } from '../models/federatedHost.js'
import { User } from '../models/user.js'
import { DataType } from 'sequelize-typescript'

export const up: Migration = async (params) => {
  const queryInterface = params.context
  await queryInterface.addColumn('posts', 'replyControl', {
    type: DataTypes.INTEGER,
    defaultValue: 0
  })
  await queryInterface.addColumn('posts', 'likeControl', {
    type: DataTypes.INTEGER,
    defaultValue: 0
  })
  await queryInterface.addColumn('posts', 'reblogControl', {
    type: DataTypes.INTEGER,
    defaultValue: 0
  })
  await queryInterface.addColumn('posts', 'quoteControl', {
    type: DataTypes.INTEGER,
    defaultValue: 0
  })
}
export const down: Migration = async (params) => {
  const queryInterface = params.context
  await queryInterface.removeColumn('posts', 'replyControl')
  await queryInterface.removeColumn('posts', 'likeControl')
  await queryInterface.removeColumn('posts', 'reblogControl')
  await queryInterface.removeColumn('posts', 'quoteControl')
}
