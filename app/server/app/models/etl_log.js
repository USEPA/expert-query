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
      startTime: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "start_time",
      },
      endTime: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "end_time",
      },
      loadError: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "load_error",
      },
    },
    { timestamps: false, tableName: "etl_log", schema: "logging" }
  );
};
