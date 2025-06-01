import { DataTypes, Sequelize, UUIDV4 } from 'sequelize'
import { Migration } from '../migrate.js'
import { FederatedHost } from '../models/federatedHost.js'
import { User } from '../models/user.js'
import { DataType } from 'sequelize-typescript'

export const up: Migration = async (params) => {
  const queryInterface = params.context

  await queryInterface.sequelize.query(`ALTER TABLE "mfaDetails" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`)
}
export const down: Migration = async (params) => {}
