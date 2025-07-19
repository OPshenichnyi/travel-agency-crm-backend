import sequelize from "../config/database.js";

/**
 * Migration to update Order table structure
 * Changes:
 * - Remove agentCountry and locationTravel columns
 * - Add clientCountry, countryTravel, cityTravel, propertyName, propertyNumber, discount columns
 * - Update payments structure to remove method from balance
 */
export const up = async () => {
  try {
    console.log("Starting migration: Update Order table structure");

    // Check if columns exist before adding them
    const [columns] = await sequelize.query(`
      PRAGMA table_info(orders);
    `);

    const columnNames = columns.map((col) => col.name);

    // Add new columns if they don't exist
    if (!columnNames.includes("clientCountry")) {
      await sequelize.query(`
        ALTER TABLE orders ADD COLUMN clientCountry VARCHAR(255) NOT NULL DEFAULT '';
      `);
      console.log("Added clientCountry column");
    }

    if (!columnNames.includes("countryTravel")) {
      await sequelize.query(`
        ALTER TABLE orders ADD COLUMN countryTravel VARCHAR(255) NOT NULL DEFAULT '';
      `);
      console.log("Added countryTravel column");
    }

    if (!columnNames.includes("cityTravel")) {
      await sequelize.query(`
        ALTER TABLE orders ADD COLUMN cityTravel VARCHAR(255) NOT NULL DEFAULT '';
      `);
      console.log("Added cityTravel column");
    }

    if (!columnNames.includes("propertyName")) {
      await sequelize.query(`
        ALTER TABLE orders ADD COLUMN propertyName VARCHAR(255) NOT NULL DEFAULT '';
      `);
      console.log("Added propertyName column");
    }

    if (!columnNames.includes("propertyNumber")) {
      await sequelize.query(`
        ALTER TABLE orders ADD COLUMN propertyNumber VARCHAR(255) NOT NULL DEFAULT '';
      `);
      console.log("Added propertyNumber column");
    }

    if (!columnNames.includes("discount")) {
      await sequelize.query(`
        ALTER TABLE orders ADD COLUMN discount FLOAT DEFAULT 0;
      `);
      console.log("Added discount column");
    }

    // Change reservationNumber from INTEGER to STRING
    await sequelize.query(`
      ALTER TABLE orders MODIFY COLUMN reservationNumber VARCHAR(255) NOT NULL;
    `);
    console.log("Changed reservationNumber to STRING type");

    // Update existing data - copy agentCountry to clientCountry and locationTravel to countryTravel
    if (
      columnNames.includes("agentCountry") &&
      columnNames.includes("locationTravel")
    ) {
      await sequelize.query(`
        UPDATE orders 
        SET clientCountry = agentCountry, 
            countryTravel = locationTravel,
            cityTravel = locationTravel,
            propertyName = 'Default Property',
            propertyNumber = '1'
        WHERE clientCountry = '' OR countryTravel = '';
      `);
      console.log("Updated existing data");
    }

    // Remove old columns if they exist
    if (columnNames.includes("agentCountry")) {
      await sequelize.query(`
        ALTER TABLE orders DROP COLUMN agentCountry;
      `);
      console.log("Removed agentCountry column");
    }

    if (columnNames.includes("locationTravel")) {
      await sequelize.query(`
        ALTER TABLE orders DROP COLUMN locationTravel;
      `);
      console.log("Removed locationTravel column");
    }

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
};

/**
 * Rollback migration
 */
export const down = async () => {
  try {
    console.log("Rolling back migration: Update Order table structure");

    // Check if columns exist before adding them back
    const [columns] = await sequelize.query(`
      PRAGMA table_info(orders);
    `);

    const columnNames = columns.map((col) => col.name);

    // Add back old columns if they don't exist
    if (!columnNames.includes("agentCountry")) {
      await sequelize.query(`
        ALTER TABLE orders ADD COLUMN agentCountry VARCHAR(255) NOT NULL DEFAULT '';
      `);
      console.log("Added back agentCountry column");
    }

    if (!columnNames.includes("locationTravel")) {
      await sequelize.query(`
        ALTER TABLE orders ADD COLUMN locationTravel VARCHAR(255) NOT NULL DEFAULT '';
      `);
      console.log("Added back locationTravel column");
    }

    // Copy data back if new columns exist
    if (
      columnNames.includes("clientCountry") &&
      columnNames.includes("countryTravel")
    ) {
      await sequelize.query(`
        UPDATE orders 
        SET agentCountry = clientCountry, 
            locationTravel = countryTravel
        WHERE agentCountry = '' OR locationTravel = '';
      `);
      console.log("Copied data back to old columns");
    }

    // Remove new columns if they exist
    if (columnNames.includes("clientCountry")) {
      await sequelize.query(`
        ALTER TABLE orders DROP COLUMN clientCountry;
      `);
      console.log("Removed clientCountry column");
    }

    if (columnNames.includes("countryTravel")) {
      await sequelize.query(`
        ALTER TABLE orders DROP COLUMN countryTravel;
      `);
      console.log("Removed countryTravel column");
    }

    if (columnNames.includes("cityTravel")) {
      await sequelize.query(`
        ALTER TABLE orders DROP COLUMN cityTravel;
      `);
      console.log("Removed cityTravel column");
    }

    if (columnNames.includes("propertyName")) {
      await sequelize.query(`
        ALTER TABLE orders DROP COLUMN propertyName;
      `);
      console.log("Removed propertyName column");
    }

    if (columnNames.includes("propertyNumber")) {
      await sequelize.query(`
        ALTER TABLE orders DROP COLUMN propertyNumber;
      `);
      console.log("Removed propertyNumber column");
    }

    if (columnNames.includes("discount")) {
      await sequelize.query(`
        ALTER TABLE orders DROP COLUMN discount;
      `);
      console.log("Removed discount column");
    }

    // Change reservationNumber back to INTEGER
    await sequelize.query(`
      ALTER TABLE orders MODIFY COLUMN reservationNumber INTEGER NOT NULL;
    `);
    console.log("Changed reservationNumber back to INTEGER type");

    console.log("Rollback completed successfully");
  } catch (error) {
    console.error("Rollback failed:", error);
    throw error;
  }
};
