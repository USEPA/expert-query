module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Assessment",
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "id",
        primaryKey: true,
        autoIncrement: true,
      },
      reportingCycle: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "reporting_cycle",
      },
      assessmentUnitId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "assessment_unit_id",
      },
      assessmentUnitName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "assessment_unit_name",
      },
      organizationId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "organization_id",
      },
      organizationName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "organization_name",
      },
      organizationType: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "organization_type",
      },
      overallStatus: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "overall_status",
      },
      region: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "region",
      },
      state: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "state",
      },
      irCategory: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "ir_category",
      },
    },
    { timestamps: false, tableName: "assessments" }
  );
};
