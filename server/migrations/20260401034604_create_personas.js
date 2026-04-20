// migrations/xxxx_create_personas.js
exports.up = function(knex) {
  return knex.schema.createTable('personas', (table) => {
    table.string('id').primary();
    table.string('name');
    table.integer('age');
    table.string('occupation');
    table.string('platform');
    table.text('avatar');
    table.text('bio');
    table.text('writingStyle'); // 改为 text，SQLite 中存储 JSON 字符串
    table.string('contentPreference');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('personas');
};