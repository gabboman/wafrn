import { DataTypes } from 'sequelize'
import { Migration } from '../migrate.js'

export const up: Migration = async (params) => {
  const queryInterface = params.context
  await queryInterface.sequelize.query(`CREATE EXTENSION pg_trgm;`)
  await queryInterface.sequelize.query(`CREATE INDEX tags_gin_index ON "postTags" USING gin ("tagName" gin_trgm_ops);`)
}
export const down: Migration = async (params) => {
  const queryInterface = params.context
  await queryInterface.sequelize.query(`DROP INDEX tags_gin_index`)
}
