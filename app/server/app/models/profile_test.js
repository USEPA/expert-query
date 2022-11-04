module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "ProfileTest",
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "id",
        primaryKey: true,
        autoIncrement: true,
      },
      assessmentName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "assessment_name",
      },
    },
    { timestamps: false, tableName: "profile_test" }
  );
};
