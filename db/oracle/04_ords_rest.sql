-- ============================================================================
-- FlexiFit: Oracle 23c / APEX Deliverable
-- Script: 04_ords_rest.sql
-- Enables schema for ORDS and configures custom REST endpoints
-- ============================================================================

-- 1. Enable the current schema for ORDS
BEGIN
  ORDS.enable_schema(
    p_enabled             => TRUE,
    p_schema              => USER,
    p_url_mapping_type    => 'BASE_PATH',
    p_url_mapping_pattern => 'flexifit',
    p_auto_rest_auth      => FALSE
  );
  COMMIT;
END;
/

-- 2. Define ORDS REST Module 'v1'
BEGIN
  ORDS.delete_module(p_module_name => 'flexifit_v1');
EXCEPTION WHEN OTHERS THEN NULL;
END;
/

BEGIN
  ORDS.define_module(
    p_module_name    => 'flexifit_v1',
    p_base_path      => 'v1/',
    p_items_per_page => 100,
    p_status         => 'PUBLISHED',
    p_comments       => 'FlexiFit Custom SQL REST API Endpoints'
  );

  -- Template 1: User lookup by email
  ORDS.define_template(
    p_module_name => 'flexifit_v1',
    p_pattern     => 'users/by-email'
  );

  ORDS.define_handler(
    p_module_name   => 'flexifit_v1',
    p_pattern       => 'users/by-email',
    p_method        => 'GET',
    p_source_type   => ORDS.source_type_query,
    p_source        => 'SELECT id, email, password_hash, role, name, phone, avatar_url, created_at FROM users WHERE LOWER(email) = LOWER(:email)'
  );

  -- Template 2: Trainer Clients with Compliance Flags
  ORDS.define_template(
    p_module_name => 'flexifit_v1',
    p_pattern     => 'trainer/:trainer_id/clients'
  );

  ORDS.define_handler(
    p_module_name   => 'flexifit_v1',
    p_pattern       => 'trainer/:trainer_id/clients',
    p_method        => 'GET',
    p_source_type   => ORDS.source_type_query,
    p_source        => q'[
      SELECT
        u.id, u.email, u.role, u.name, u.phone, u.avatar_url,
        cp.fitness_goal, cp.target_weight_kg, cp.current_weight_kg, cp.target_calories,
        cp.streak_days,
        vf.flag_missed_workouts,
        vf.flag_nutrition_deficit,
        vf.flag_stale_weight,
        vf.flag_overdue_checkin,
        CASE
          WHEN vf.flag_missed_workouts = 1 OR vf.flag_nutrition_deficit = 1
            OR vf.flag_stale_weight = 1 OR vf.flag_overdue_checkin = 1 THEN 1
          ELSE 0
        END AS is_flagged
      FROM users u
      JOIN client_profiles cp ON u.id = cp.user_id
      JOIN v_client_flags vf ON u.id = vf.client_id
      WHERE cp.trainer_id = :trainer_id
      ORDER BY is_flagged DESC, cp.streak_days ASC
    ]'
  );

  -- Template 3: Foods search
  ORDS.define_template(
    p_module_name => 'flexifit_v1',
    p_pattern     => 'foods/'
  );

  ORDS.define_handler(
    p_module_name   => 'flexifit_v1',
    p_pattern       => 'foods/',
    p_method        => 'GET',
    p_source_type   => ORDS.source_type_query,
    p_source        => 'SELECT * FROM foods WHERE (:q IS NULL OR LOWER(name) LIKE ''%'' || LOWER(:q) || ''%'' OR LOWER(local_name) LIKE ''%'' || LOWER(:q) || ''%'') ORDER BY name ASC'
  );

  -- Template 4: Log workout (POST)
  ORDS.define_template(
    p_module_name => 'flexifit_v1',
    p_pattern     => 'workout-logs/'
  );

  ORDS.define_handler(
    p_module_name   => 'flexifit_v1',
    p_pattern       => 'workout-logs/',
    p_method        => 'POST',
    p_source_type   => ORDS.source_type_plsql,
    p_source        => q'[
      DECLARE
        l_id VARCHAR2(64) := 'wlog-' || TO_CHAR(SYSTIMESTAMP, 'YYYYMMDDHH24MISSFF3');
      BEGIN
        INSERT INTO workout_logs (id, client_id, exercise_name, sets_completed, reps_completed, weight_kg, duration_minutes, notes)
        VALUES (l_id, :client_id, :exercise_name, :sets_completed, :reps_completed, :weight_kg, :duration_minutes, :notes);

        UPDATE client_profiles SET streak_days = streak_days + 1 WHERE user_id = :client_id;
        :status := 201;
      END;
    ]'
  );

  COMMIT;
END;
/
