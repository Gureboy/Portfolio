-- Neon Database Schema for D&D Portfolio Game
-- Complete player progression and statistics system

-- Players table - stores player accounts
CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_playtime INTEGER DEFAULT 0, -- in minutes
    preferred_language VARCHAR(5) DEFAULT 'es'
);

-- Characters table - player characters
CREATE TABLE IF NOT EXISTS characters (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    class_name VARCHAR(50) NOT NULL,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    gold INTEGER DEFAULT 50,
    max_hp INTEGER DEFAULT 20,
    current_hp INTEGER DEFAULT 20,
    armor_class INTEGER DEFAULT 10,
    -- Stats
    strength INTEGER DEFAULT 10,
    dexterity INTEGER DEFAULT 10,
    constitution INTEGER DEFAULT 10,
    intelligence INTEGER DEFAULT 10,
    wisdom INTEGER DEFAULT 10,
    charisma INTEGER DEFAULT 10,
    -- Abilities
    rage_uses INTEGER DEFAULT 0,
    spell_slots INTEGER DEFAULT 0,
    heal_uses INTEGER DEFAULT 0,
    sneak_uses INTEGER DEFAULT 0,
    -- Progress
    current_encounter INTEGER DEFAULT 0,
    encounters_completed INTEGER DEFAULT 0,
    bosses_defeated INTEGER DEFAULT 0,
    deaths INTEGER DEFAULT 0,
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Equipment table - items equipped by characters
CREATE TABLE IF NOT EXISTS equipment (
    id SERIAL PRIMARY KEY,
    character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    slot_type VARCHAR(20) NOT NULL, -- 'weapon', 'armor', 'ring', etc.
    item_name VARCHAR(100) NOT NULL,
    item_rarity VARCHAR(20) DEFAULT 'common',
    item_effect VARCHAR(50),
    item_value INTEGER DEFAULT 0,
    is_enhanced BOOLEAN DEFAULT FALSE,
    equipped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory table - items in character inventories
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    item_name VARCHAR(100) NOT NULL,
    item_type VARCHAR(50), -- 'consumable', 'weapon', 'armor', 'material'
    item_rarity VARCHAR(20) DEFAULT 'common',
    quantity INTEGER DEFAULT 1,
    obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Game sessions - tracks individual play sessions
CREATE TABLE IF NOT EXISTS game_sessions (
    id SERIAL PRIMARY KEY,
    character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP,
    encounters_in_session INTEGER DEFAULT 0,
    experience_gained INTEGER DEFAULT 0,
    gold_gained INTEGER DEFAULT 0,
    items_found INTEGER DEFAULT 0,
    session_outcome VARCHAR(20), -- 'victory', 'death', 'abandoned'
    final_level INTEGER,
    final_encounter INTEGER
);

-- Combat logs - detailed combat history
CREATE TABLE IF NOT EXISTS combat_logs (
    id SERIAL PRIMARY KEY,
    character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES game_sessions(id) ON DELETE CASCADE,
    encounter_number INTEGER,
    monster_name VARCHAR(100),
    monster_level INTEGER,
    player_damage_dealt INTEGER DEFAULT 0,
    player_damage_taken INTEGER DEFAULT 0,
    combat_duration INTEGER, -- in seconds
    combat_result VARCHAR(20), -- 'victory', 'defeat'
    special_abilities_used TEXT[], -- JSON array of abilities used
    critical_hits INTEGER DEFAULT 0,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Achievements - player achievements system
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    achievement_name VARCHAR(100) NOT NULL,
    achievement_description TEXT,
    achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    character_name VARCHAR(100), -- Which character earned it
    UNIQUE(player_id, achievement_name)
);

-- Global leaderboard - best scores across all players
CREATE TABLE IF NOT EXISTS leaderboard (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    character_name VARCHAR(100) NOT NULL,
    character_class VARCHAR(50),
    final_level INTEGER,
    total_experience INTEGER,
    gold_accumulated INTEGER,
    encounters_completed INTEGER,
    bosses_defeated INTEGER,
    play_time INTEGER, -- in minutes
    legendary_items INTEGER DEFAULT 0,
    achievement_count INTEGER DEFAULT 0,
    score INTEGER GENERATED ALWAYS AS (
        final_level * 100 + 
        encounters_completed * 10 + 
        bosses_defeated * 50 + 
        legendary_items * 25 + 
        achievement_count * 15
    ) STORED,
    achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Materials and crafting
CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    material_name VARCHAR(100) NOT NULL,
    material_type VARCHAR(50), -- 'metal', 'magic', 'essence', etc.
    rarity VARCHAR(20) DEFAULT 'common',
    quantity INTEGER DEFAULT 1,
    obtained_from VARCHAR(100), -- Monster name or source
    obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crafted items log
CREATE TABLE IF NOT EXISTS crafted_items (
    id SERIAL PRIMARY KEY,
    character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    recipe_name VARCHAR(100) NOT NULL,
    item_created VARCHAR(100) NOT NULL,
    materials_used JSONB, -- JSON object with materials and quantities
    crafted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Casino/Gambling statistics
CREATE TABLE IF NOT EXISTS gambling_stats (
    id SERIAL PRIMARY KEY,
    character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    game_type VARCHAR(50), -- 'dice', 'cards', 'slots'
    bet_amount INTEGER,
    winnings INTEGER,
    game_result VARCHAR(20), -- 'win', 'loss'
    details JSONB, -- Game-specific details (rolls, cards, etc.)
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Global game statistics
CREATE TABLE IF NOT EXISTS global_stats (
    id SERIAL PRIMARY KEY,
    stat_name VARCHAR(100) UNIQUE NOT NULL,
    stat_value BIGINT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Character progression milestones
CREATE TABLE IF NOT EXISTS character_milestones (
    id SERIAL PRIMARY KEY,
    character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    milestone_type VARCHAR(50), -- 'level_up', 'boss_defeated', 'area_completed'
    milestone_value INTEGER,
    description TEXT,
    achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PvP battles (for future expansion)
CREATE TABLE IF NOT EXISTS pvp_battles (
    id SERIAL PRIMARY KEY,
    challenger_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    defender_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    winner_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    battle_log JSONB, -- Detailed battle information
    battle_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Guild system (for future expansion)
CREATE TABLE IF NOT EXISTS guilds (
    id SERIAL PRIMARY KEY,
    guild_name VARCHAR(100) UNIQUE NOT NULL,
    guild_description TEXT,
    leader_id INTEGER REFERENCES players(id) ON DELETE SET NULL,
    member_count INTEGER DEFAULT 1,
    guild_level INTEGER DEFAULT 1,
    guild_experience INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS guild_members (
    id SERIAL PRIMARY KEY,
    guild_id INTEGER REFERENCES guilds(id) ON DELETE CASCADE,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    member_role VARCHAR(20) DEFAULT 'member', -- 'leader', 'officer', 'member'
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    contribution_points INTEGER DEFAULT 0,
    UNIQUE(guild_id, player_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_characters_player_id ON characters(player_id);
CREATE INDEX IF NOT EXISTS idx_characters_last_played ON characters(last_played DESC);
CREATE INDEX IF NOT EXISTS idx_characters_level ON characters(level DESC);
CREATE INDEX IF NOT EXISTS idx_equipment_character_id ON equipment(character_id);
CREATE INDEX IF NOT EXISTS idx_inventory_character_id ON inventory(character_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_character_id ON game_sessions(character_id);
CREATE INDEX IF NOT EXISTS idx_combat_logs_character_id ON combat_logs(character_id);
CREATE INDEX IF NOT EXISTS idx_combat_logs_timestamp ON combat_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);
CREATE INDEX IF NOT EXISTS idx_achievements_player_id ON achievements(player_id);
CREATE INDEX IF NOT EXISTS idx_gambling_stats_character_id ON gambling_stats(character_id);
CREATE INDEX IF NOT EXISTS idx_materials_character_id ON materials(character_id);
CREATE INDEX IF NOT EXISTS idx_players_username ON players(username);
CREATE INDEX IF NOT EXISTS idx_players_last_login ON players(last_login DESC);

-- Create views for common queries
CREATE OR REPLACE VIEW player_stats AS
SELECT 
    p.id as player_id,
    p.username,
    p.created_at as player_since,
    p.last_login,
    p.total_playtime,
    COUNT(DISTINCT c.id) as total_characters,
    COALESCE(MAX(c.level), 0) as highest_level,
    COALESCE(SUM(c.encounters_completed), 0) as total_encounters,
    COALESCE(SUM(c.bosses_defeated), 0) as total_bosses,
    COALESCE(COUNT(a.id), 0) as achievement_count,
    COALESCE(SUM(c.gold), 0) as total_gold_earned
FROM players p
LEFT JOIN characters c ON p.id = c.player_id
LEFT JOIN achievements a ON p.id = a.player_id
GROUP BY p.id, p.username, p.created_at, p.last_login, p.total_playtime;

CREATE OR REPLACE VIEW top_characters AS
SELECT 
    c.name as character_name,
    c.class_name,
    c.level,
    c.experience,
    c.gold,
    c.encounters_completed,
    c.bosses_defeated,
    p.username as player_name,
    c.last_played,
    (c.level * 100 + c.encounters_completed * 10 + c.bosses_defeated * 50) as score,
    ROW_NUMBER() OVER (ORDER BY c.level DESC, c.experience DESC, c.encounters_completed DESC) as rank
FROM characters c
JOIN players p ON c.player_id = p.id
WHERE c.level > 1 OR c.encounters_completed > 0
ORDER BY score DESC, c.level DESC, c.experience DESC
LIMIT 100;

CREATE OR REPLACE VIEW recent_activities AS
SELECT 
    'combat' as activity_type,
    cl.character_id,
    c.name as character_name,
    p.username,
    ('Defeated ' || cl.monster_name) as activity_description,
    cl.timestamp as activity_time
FROM combat_logs cl
JOIN characters c ON cl.character_id = c.id
JOIN players p ON c.player_id = p.id
WHERE cl.combat_result = 'victory'

UNION ALL

SELECT 
    'level_up' as activity_type,
    cm.character_id,
    c.name as character_name,
    p.username,
    ('Reached level ' || cm.milestone_value::text) as activity_description,
    cm.achieved_at as activity_time
FROM character_milestones cm
JOIN characters c ON cm.character_id = c.id
JOIN players p ON c.player_id = p.id
WHERE cm.milestone_type = 'level_up'

ORDER BY activity_time DESC
LIMIT 50;

-- Functions for common operations
CREATE OR REPLACE FUNCTION update_character_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_player_login()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_login = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER characters_update_timestamp
    BEFORE UPDATE ON characters
    FOR EACH ROW
    EXECUTE FUNCTION update_character_timestamp();

CREATE TRIGGER players_update_login
    BEFORE UPDATE ON players
    FOR EACH ROW
    EXECUTE FUNCTION update_player_login();

-- Function to calculate player total score
CREATE OR REPLACE FUNCTION calculate_player_total_score(player_id_param INTEGER)
RETURNS INTEGER AS $$
DECLARE
    total_score INTEGER := 0;
    char_record RECORD;
BEGIN
    FOR char_record IN 
        SELECT level, encounters_completed, bosses_defeated, gold 
        FROM characters 
        WHERE player_id = player_id_param
    LOOP
        total_score := total_score + 
            (char_record.level * 100) + 
            (char_record.encounters_completed * 10) + 
            (char_record.bosses_defeated * 50) +
            (LEAST(char_record.gold, 1000) / 10); -- Cap gold contribution
    END LOOP;
    
    RETURN total_score;
END;
$$ LANGUAGE plpgsql;

-- Function to get character's best equipment
CREATE OR REPLACE FUNCTION get_character_equipment_summary(char_id INTEGER)
RETURNS TABLE(
    weapon_name VARCHAR(100),
    armor_name VARCHAR(100),
    accessory_count INTEGER,
    total_item_value INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        MAX(CASE WHEN slot_type = 'weapon' THEN item_name END) as weapon_name,
        MAX(CASE WHEN slot_type = 'armor' THEN item_name END) as armor_name,
        COUNT(CASE WHEN slot_type IN ('ring', 'amulet', 'head', 'boots') THEN 1 END)::INTEGER as accessory_count,
        COALESCE(SUM(item_value), 0)::INTEGER as total_item_value
    FROM equipment 
    WHERE character_id = char_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update global statistics
CREATE OR REPLACE FUNCTION update_global_stat(stat_name_param VARCHAR(100), increment_value BIGINT DEFAULT 1)
RETURNS VOID AS $$
BEGIN
    INSERT INTO global_stats (stat_name, stat_value)
    VALUES (stat_name_param, increment_value)
    ON CONFLICT (stat_name)
    DO UPDATE SET 
        stat_value = global_stats.stat_value + increment_value,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Procedure to clean old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS VOID AS $$
BEGIN
    -- Delete combat logs older than 6 months
    DELETE FROM combat_logs 
    WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '6 months';
    
    -- Delete game sessions older than 1 year for characters that haven't been played
    DELETE FROM game_sessions 
    WHERE session_start < CURRENT_TIMESTAMP - INTERVAL '1 year'
    AND character_id IN (
        SELECT id FROM characters 
        WHERE last_played < CURRENT_TIMESTAMP - INTERVAL '1 year'
    );
    
    -- Archive inactive players (haven't logged in for 2 years)
    UPDATE players 
    SET username = 'archived_' || id::text 
    WHERE last_login < CURRENT_TIMESTAMP - INTERVAL '2 years'
    AND username NOT LIKE 'archived_%';
END;
$$ LANGUAGE plpgsql;

-- Insert initial global statistics
INSERT INTO global_stats (stat_name, stat_value) VALUES 
('total_players', 0),
('total_characters', 0),
('total_sessions', 0),
('total_combats', 0),
('total_gold_earned', 0),
('total_experience_gained', 0),
('total_bosses_defeated', 0)
ON CONFLICT (stat_name) DO NOTHING;

-- Sample data for testing (optional - remove in production)
INSERT INTO players (username, email) VALUES 
('Katosx_Master', 'danielsalini77@gmail.com'),
('TestHero', 'test@portfolio.game'),
('DemoPlayer', 'demo@portfolio.game')
ON CONFLICT (username) DO NOTHING;

-- Create sample characters for demonstration
WITH sample_player AS (
    SELECT id FROM players WHERE username = 'Katosx_Master' LIMIT 1
)
INSERT INTO characters (player_id, name, class_name, level, experience, gold, encounters_completed, bosses_defeated) 
SELECT 
    id, 
    'Aragorn Legendario', 
    'Bárbaro', 
    8, 
    750, 
    500, 
    25, 
    2 
FROM sample_player
ON CONFLICT DO NOTHING;

WITH sample_player AS (
    SELECT id FROM players WHERE username = 'TestHero' LIMIT 1
)
INSERT INTO characters (player_id, name, class_name, level, experience, gold, encounters_completed, bosses_defeated) 
SELECT 
    id, 
    'Gandalf Sabio', 
    'Mago', 
    6, 
    450, 
    300, 
    18, 
    1 
FROM sample_player
ON CONFLICT DO NOTHING;

-- Create some sample achievements
WITH sample_chars AS (
    SELECT c.id as char_id, c.name as char_name, p.id as player_id 
    FROM characters c 
    JOIN players p ON c.player_id = p.id 
    WHERE p.username IN ('Katosx_Master', 'TestHero')
)
INSERT INTO achievements (player_id, achievement_name, achievement_description, character_name)
SELECT 
    player_id,
    'First Victory',
    'Won your first combat',
    char_name
FROM sample_chars
ON CONFLICT (player_id, achievement_name) DO NOTHING;

-- Update global stats with sample data
SELECT update_global_stat('total_players', (SELECT COUNT(*) FROM players));
SELECT update_global_stat('total_characters', (SELECT COUNT(*) FROM characters));

-- Create a final summary view for the admin dashboard
CREATE OR REPLACE VIEW admin_dashboard AS
SELECT 
    'Total Players' as metric,
    COUNT(*)::text as value,
    'users' as category
FROM players
UNION ALL
SELECT 
    'Active Characters' as metric,
    COUNT(*)::text as value,
    'characters' as category  
FROM characters WHERE level > 1
UNION ALL
SELECT 
    'Total Sessions' as metric,
    COUNT(*)::text as value,
    'gameplay' as category
FROM game_sessions
UNION ALL
SELECT 
    'Highest Level' as metric,
    MAX(level)::text as value,
    'records' as category
FROM characters
UNION ALL
SELECT 
    'Total Gold Earned' as metric,
    SUM(gold)::text as value,
    'economy' as category
FROM characters
UNION ALL
SELECT 
    'Bosses Defeated' as metric,
    SUM(bosses_defeated)::text as value,
    'combat' as category
FROM characters;

-- Grant necessary permissions (adjust for your specific setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- Create a stored procedure for game session management
CREATE OR REPLACE FUNCTION start_game_session(char_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    session_id INTEGER;
BEGIN
    INSERT INTO game_sessions (character_id, session_start)
    VALUES (char_id, CURRENT_TIMESTAMP)
    RETURNING id INTO session_id;
    
    -- Update global stats
    PERFORM update_global_stat('total_sessions', 1);
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION end_game_session(
    session_id_param INTEGER,
    outcome VARCHAR(20),
    final_level_param INTEGER,
    final_encounter_param INTEGER,
    exp_gained INTEGER DEFAULT 0,
    gold_gained INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
    UPDATE game_sessions 
    SET 
        session_end = CURRENT_TIMESTAMP,
        session_outcome = outcome,
        final_level = final_level_param,
        final_encounter = final_encounter_param,
        experience_gained = exp_gained,
        gold_gained = gold_gained
    WHERE id = session_id_param;
    
    -- Update global stats
    PERFORM update_global_stat('total_experience_gained', exp_gained);
    PERFORM update_global_stat('total_gold_earned', gold_gained);
END;
$$ LANGUAGE plpgsql;

-- Final verification query
SELECT 
    'Database setup completed successfully!' as status,
    COUNT(*) as tables_created
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'players', 'characters', 'equipment', 'inventory', 
    'game_sessions', 'combat_logs', 'achievements', 
    'leaderboard', 'materials', 'crafted_items', 
    'gambling_stats', 'global_stats'
);
