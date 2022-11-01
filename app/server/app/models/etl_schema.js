module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "etlSchema",
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "id",
        primaryKey: true,
        autoIncrement: true,
      },
      schemaName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "schema_name",
      },
      creationDate: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "creation_date",
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        field: "active",
      },
    },
    { timestamps: false, tableName: "etl_schemas", schema: "logging" }
  );
};
