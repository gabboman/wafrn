import { DataTypes } from 'sequelize'
import { Migration } from '../migrate.js'

export const up: Migration = async (params) => {
  const queryInterface = params.context
  await queryInterface.sequelize.query(`CREATE INDEX userUrl_gin_index ON "users" USING gin ("url" gin_trgm_ops);`)
}
export const down: Migration = async (params) => {
  const queryInterface = params.context
  await queryInterface.sequelize.query(`DROP INDEX userUrl_gin_index`)
}
