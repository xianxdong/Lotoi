const { Schema, model } = require("mongoose");

const guildSettingsSchema = new Schema (
    {
        guildId: { type: String, required: true, unique: true },
        messageLogChannel: {type: String, default: null},
        modLogChannel: {type: String, default: null}
    },
    { timestamps: true, versionKey: false }
);

const name = "guild_settings"
module.exports = model(name, guildSettingsSchema);