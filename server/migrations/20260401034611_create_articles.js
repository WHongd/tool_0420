exports.up = function(knex) {
  return knex.schema.createTable('articles', table => {
    table.string('id').primary();
    table.string('title');
    table.text('content');
    table.string('personaId').references('id').inTable('personas');
    table.string('platform');
    table.string('status'); // draft, published
    table.json('engagementMetrics');
    table.timestamp('publishedAt');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('articles');
};