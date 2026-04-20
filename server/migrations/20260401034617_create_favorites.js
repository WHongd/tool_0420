exports.up = function(knex) {
  return knex.schema.createTable('favorites', table => {
    table.increments('id');
    table.string('articleId').references('id').inTable('articles');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('favorites');
};