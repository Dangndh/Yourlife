export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activity_logs: {
        Row: {
          created_at: string
          deleted_at: string | null
          duration_min: number | null
          goal_id: string | null
          id: string
          life_area_id: string
          notes: string | null
          occurred_at: string
          project_id: string | null
          source_id: string | null
          source_table: string | null
          task_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          deleted_at?: string | null
          duration_min?: number | null
          goal_id?: string | null
          id?: string
          life_area_id: string
          notes?: string | null
          occurred_at?: string
          project_id?: string | null
          source_id?: string | null
          source_table?: string | null
          task_id?: string | null
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          duration_min?: number | null
          goal_id?: string | null
          id?: string
          life_area_id?: string
          notes?: string | null
          occurred_at?: string
          project_id?: string | null
          source_id?: string | null
          source_table?: string | null
          task_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "v_goal_progress"
            referencedColumns: ["goal_id"]
          },
          {
            foreignKeyName: "activity_logs_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "life_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "v_life_area_summary"
            referencedColumns: ["life_area_id"]
          },
          {
            foreignKeyName: "activity_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          file_name: string
          id: string
          mime_type: string | null
          size_bytes: number | null
          storage_path: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          file_name: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      car_achievements: {
        Row: {
          achieved_on: string
          created_at: string
          deleted_at: string | null
          goal_id: string | null
          id: string
          impact: string | null
          job_id: string | null
          kind: string
          skill_id: string | null
          title: string
          updated_at: string
          user_id: string
          work_project_id: string | null
        }
        ComputedFields: never
        Insert: {
          achieved_on?: string
          created_at?: string
          deleted_at?: string | null
          goal_id?: string | null
          id?: string
          impact?: string | null
          job_id?: string | null
          kind?: string
          skill_id?: string | null
          title: string
          updated_at?: string
          user_id?: string
          work_project_id?: string | null
        }
        Update: {
          achieved_on?: string
          created_at?: string
          deleted_at?: string | null
          goal_id?: string | null
          id?: string
          impact?: string | null
          job_id?: string | null
          kind?: string
          skill_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          work_project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "car_achievements_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_achievements_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "v_goal_progress"
            referencedColumns: ["goal_id"]
          },
          {
            foreignKeyName: "car_achievements_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "car_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_achievements_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_achievements_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "v_skill_levels"
            referencedColumns: ["skill_id"]
          },
          {
            foreignKeyName: "car_achievements_work_project_id_fkey"
            columns: ["work_project_id"]
            isOneToOne: false
            referencedRelation: "car_work_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      car_jobs: {
        Row: {
          company: string
          created_at: string
          deleted_at: string | null
          description: string | null
          employment_type: string
          ended_on: string | null
          id: string
          location: string | null
          started_on: string
          title: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          company: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          employment_type?: string
          ended_on?: string | null
          id?: string
          location?: string | null
          started_on: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          company?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          employment_type?: string
          ended_on?: string | null
          id?: string
          location?: string | null
          started_on?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      car_work_projects: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          ended_on: string | null
          id: string
          job_id: string | null
          name: string
          outcome: string | null
          project_id: string | null
          role: string | null
          started_on: string | null
          status: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          ended_on?: string | null
          id?: string
          job_id?: string | null
          name: string
          outcome?: string | null
          project_id?: string | null
          role?: string | null
          started_on?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          ended_on?: string | null
          id?: string
          job_id?: string | null
          name?: string
          outcome?: string | null
          project_id?: string | null
          role?: string | null
          started_on?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "car_work_projects_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "car_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_work_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          birthday: string | null
          closeness: number | null
          created_at: string
          deleted_at: string | null
          desired_contact_days: number | null
          email: string | null
          family_role: string | null
          full_name: string
          id: string
          is_family: boolean
          nickname: string | null
          notes: string | null
          phone: string | null
          relationship: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          birthday?: string | null
          closeness?: number | null
          created_at?: string
          deleted_at?: string | null
          desired_contact_days?: number | null
          email?: string | null
          family_role?: string | null
          full_name: string
          id?: string
          is_family?: boolean
          nickname?: string | null
          notes?: string | null
          phone?: string | null
          relationship?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          birthday?: string | null
          closeness?: number | null
          created_at?: string
          deleted_at?: string | null
          desired_contact_days?: number | null
          email?: string | null
          family_role?: string | null
          full_name?: string
          id?: string
          is_family?: boolean
          nickname?: string | null
          notes?: string | null
          phone?: string | null
          relationship?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          all_day: boolean
          created_at: string
          deleted_at: string | null
          description: string | null
          ends_at: string | null
          goal_id: string | null
          id: string
          life_area_id: string
          location: string | null
          project_id: string | null
          recurrence_rule: string | null
          starts_at: string
          title: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          all_day?: boolean
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          ends_at?: string | null
          goal_id?: string | null
          id?: string
          life_area_id: string
          location?: string | null
          project_id?: string | null
          recurrence_rule?: string | null
          starts_at: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          all_day?: boolean
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          ends_at?: string | null
          goal_id?: string | null
          id?: string
          life_area_id?: string
          location?: string | null
          project_id?: string | null
          recurrence_rule?: string | null
          starts_at?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "v_goal_progress"
            referencedColumns: ["goal_id"]
          },
          {
            foreignKeyName: "events_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "life_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "v_life_area_summary"
            referencedColumns: ["life_area_id"]
          },
          {
            foreignKeyName: "events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      fam_responsibilities: {
        Row: {
          created_at: string
          deleted_at: string | null
          for_contact_id: string | null
          id: string
          is_active: boolean
          notes: string | null
          shared_with: string | null
          task_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          deleted_at?: string | null
          for_contact_id?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          shared_with?: string | null
          task_id?: string | null
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          for_contact_id?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          shared_with?: string | null
          task_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fam_responsibilities_for_contact_id_fkey"
            columns: ["for_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fam_responsibilities_for_contact_id_fkey"
            columns: ["for_contact_id"]
            isOneToOne: false
            referencedRelation: "v_contact_last_interaction"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "fam_responsibilities_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_accounts: {
        Row: {
          account_type: string
          created_at: string
          currency: string
          deleted_at: string | null
          id: string
          include_in_net_worth: boolean
          is_archived: boolean
          name: string
          opened_on: string | null
          opening_balance: number
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          account_type: string
          created_at?: string
          currency?: string
          deleted_at?: string | null
          id?: string
          include_in_net_worth?: boolean
          is_archived?: boolean
          name: string
          opened_on?: string | null
          opening_balance?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          account_type?: string
          created_at?: string
          currency?: string
          deleted_at?: string | null
          id?: string
          include_in_net_worth?: boolean
          is_archived?: boolean
          name?: string
          opened_on?: string | null
          opening_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fin_asset_valuations: {
        Row: {
          asset_id: string
          created_at: string
          id: string
          note: string | null
          updated_at: string
          user_id: string
          value: number
          valued_on: string
        }
        ComputedFields: never
        Insert: {
          asset_id: string
          created_at?: string
          id?: string
          note?: string | null
          updated_at?: string
          user_id?: string
          value: number
          valued_on?: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          id?: string
          note?: string | null
          updated_at?: string
          user_id?: string
          value?: number
          valued_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "fin_asset_valuations_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "fin_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_asset_valuations_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "v_asset_current_values"
            referencedColumns: ["asset_id"]
          },
        ]
      }
      fin_assets: {
        Row: {
          acquired_on: string | null
          category: string
          created_at: string
          currency: string
          deleted_at: string | null
          disposed_on: string | null
          id: string
          kind: string
          name: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          acquired_on?: string | null
          category?: string
          created_at?: string
          currency?: string
          deleted_at?: string | null
          disposed_on?: string | null
          id?: string
          kind: string
          name: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          acquired_on?: string | null
          category?: string
          created_at?: string
          currency?: string
          deleted_at?: string | null
          disposed_on?: string | null
          id?: string
          kind?: string
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fin_budgets: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          deleted_at: string | null
          ends_on: string | null
          id: string
          starts_on: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          deleted_at?: string | null
          ends_on?: string | null
          id?: string
          starts_on?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          deleted_at?: string | null
          ends_on?: string | null
          id?: string
          starts_on?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fin_budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "fin_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_categories: {
        Row: {
          created_at: string
          deleted_at: string | null
          icon: string | null
          id: string
          kind: string
          life_area_id: string | null
          name: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          deleted_at?: string | null
          icon?: string | null
          id?: string
          kind: string
          life_area_id?: string | null
          name: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          icon?: string | null
          id?: string
          kind?: string
          life_area_id?: string | null
          name?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fin_categories_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "life_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_categories_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "v_life_area_summary"
            referencedColumns: ["life_area_id"]
          },
          {
            foreignKeyName: "fin_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "fin_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_exchange_rates: {
        Row: {
          base_currency: string
          created_at: string
          currency: string
          id: string
          rate_date: string
          rate_to_base: number
          source: string | null
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          base_currency: string
          created_at?: string
          currency: string
          id?: string
          rate_date?: string
          rate_to_base: number
          source?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          base_currency?: string
          created_at?: string
          currency?: string
          id?: string
          rate_date?: string
          rate_to_base?: number
          source?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fin_transactions: {
        Row: {
          account_id: string
          amount: number
          category_id: string | null
          contact_id: string | null
          created_at: string
          deleted_at: string | null
          goal_id: string | null
          id: string
          import_ref: string | null
          note: string | null
          occurred_on: string
          payee: string | null
          transfer_account_id: string | null
          transfer_amount: number | null
          txn_type: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          account_id: string
          amount: number
          category_id?: string | null
          contact_id?: string | null
          created_at?: string
          deleted_at?: string | null
          goal_id?: string | null
          id?: string
          import_ref?: string | null
          note?: string | null
          occurred_on?: string
          payee?: string | null
          transfer_account_id?: string | null
          transfer_amount?: number | null
          txn_type: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          account_id?: string
          amount?: number
          category_id?: string | null
          contact_id?: string | null
          created_at?: string
          deleted_at?: string | null
          goal_id?: string | null
          id?: string
          import_ref?: string | null
          note?: string | null
          occurred_on?: string
          payee?: string | null
          transfer_account_id?: string | null
          transfer_amount?: number | null
          txn_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fin_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "fin_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_account_balances"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "fin_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "fin_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_transactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_transactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "v_contact_last_interaction"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "fin_transactions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_transactions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "v_goal_progress"
            referencedColumns: ["goal_id"]
          },
          {
            foreignKeyName: "fin_transactions_transfer_account_id_fkey"
            columns: ["transfer_account_id"]
            isOneToOne: false
            referencedRelation: "fin_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_transactions_transfer_account_id_fkey"
            columns: ["transfer_account_id"]
            isOneToOne: false
            referencedRelation: "v_account_balances"
            referencedColumns: ["account_id"]
          },
        ]
      }
      goals: {
        Row: {
          achieved_at: string | null
          baseline_value: number | null
          created_at: string
          deleted_at: string | null
          description: string | null
          goal_type: string
          id: string
          life_area_id: string
          metric_id: string | null
          parent_goal_id: string | null
          priority: number
          start_date: string | null
          status: string
          target_date: string | null
          target_value: number | null
          title: string
          updated_at: string
          user_id: string
          why: string | null
        }
        ComputedFields: never
        Insert: {
          achieved_at?: string | null
          baseline_value?: number | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          goal_type?: string
          id?: string
          life_area_id: string
          metric_id?: string | null
          parent_goal_id?: string | null
          priority?: number
          start_date?: string | null
          status?: string
          target_date?: string | null
          target_value?: number | null
          title: string
          updated_at?: string
          user_id?: string
          why?: string | null
        }
        Update: {
          achieved_at?: string | null
          baseline_value?: number | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          goal_type?: string
          id?: string
          life_area_id?: string
          metric_id?: string | null
          parent_goal_id?: string | null
          priority?: number
          start_date?: string | null
          status?: string
          target_date?: string | null
          target_value?: number | null
          title?: string
          updated_at?: string
          user_id?: string
          why?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "life_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "v_life_area_summary"
            referencedColumns: ["life_area_id"]
          },
          {
            foreignKeyName: "goals_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_parent_goal_id_fkey"
            columns: ["parent_goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_parent_goal_id_fkey"
            columns: ["parent_goal_id"]
            isOneToOne: false
            referencedRelation: "v_goal_progress"
            referencedColumns: ["goal_id"]
          },
        ]
      }
      grw_experiences: {
        Row: {
          created_at: string
          deleted_at: string | null
          ended_on: string | null
          goal_id: string | null
          id: string
          kind: string
          lessons: string | null
          location: string | null
          occurred_on: string
          rating: number | null
          story: string | null
          title: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          deleted_at?: string | null
          ended_on?: string | null
          goal_id?: string | null
          id?: string
          kind?: string
          lessons?: string | null
          location?: string | null
          occurred_on?: string
          rating?: number | null
          story?: string | null
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          ended_on?: string | null
          goal_id?: string | null
          id?: string
          kind?: string
          lessons?: string | null
          location?: string | null
          occurred_on?: string
          rating?: number | null
          story?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grw_experiences_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grw_experiences_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "v_goal_progress"
            referencedColumns: ["goal_id"]
          },
        ]
      }
      habit_checkins: {
        Row: {
          checkin_date: string
          created_at: string
          habit_id: string
          id: string
          note: string | null
          updated_at: string
          user_id: string
          value: number
        }
        ComputedFields: never
        Insert: {
          checkin_date?: string
          created_at?: string
          habit_id: string
          id?: string
          note?: string | null
          updated_at?: string
          user_id?: string
          value?: number
        }
        Update: {
          checkin_date?: string
          created_at?: string
          habit_id?: string
          id?: string
          note?: string | null
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "habit_checkins_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_checkins_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "v_habit_this_week"
            referencedColumns: ["habit_id"]
          },
        ]
      }
      habits: {
        Row: {
          cadence: string
          created_at: string
          deleted_at: string | null
          goal_id: string | null
          id: string
          is_active: boolean
          life_area_id: string
          started_on: string
          target_per_period: number
          title: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          cadence?: string
          created_at?: string
          deleted_at?: string | null
          goal_id?: string | null
          id?: string
          is_active?: boolean
          life_area_id: string
          started_on?: string
          target_per_period?: number
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          cadence?: string
          created_at?: string
          deleted_at?: string | null
          goal_id?: string | null
          id?: string
          is_active?: boolean
          life_area_id?: string
          started_on?: string
          target_per_period?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habits_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habits_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "v_goal_progress"
            referencedColumns: ["goal_id"]
          },
          {
            foreignKeyName: "habits_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "life_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habits_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "v_life_area_summary"
            referencedColumns: ["life_area_id"]
          },
        ]
      }
      hlt_medical_records: {
        Row: {
          created_at: string
          deleted_at: string | null
          follow_up_on: string | null
          id: string
          notes: string | null
          occurred_on: string
          provider: string | null
          record_type: string
          result: string | null
          title: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          deleted_at?: string | null
          follow_up_on?: string | null
          id?: string
          notes?: string | null
          occurred_on?: string
          provider?: string | null
          record_type: string
          result?: string | null
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          follow_up_on?: string | null
          id?: string
          notes?: string | null
          occurred_on?: string
          provider?: string | null
          record_type?: string
          result?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hlt_workouts: {
        Row: {
          calories: number | null
          created_at: string
          deleted_at: string | null
          distance_km: number | null
          duration_min: number
          id: string
          intensity: number | null
          notes: string | null
          occurred_at: string
          updated_at: string
          user_id: string
          workout_type: string
        }
        ComputedFields: never
        Insert: {
          calories?: number | null
          created_at?: string
          deleted_at?: string | null
          distance_km?: number | null
          duration_min: number
          id?: string
          intensity?: number | null
          notes?: string | null
          occurred_at?: string
          updated_at?: string
          user_id?: string
          workout_type?: string
        }
        Update: {
          calories?: number | null
          created_at?: string
          deleted_at?: string | null
          distance_km?: number | null
          duration_min?: number
          id?: string
          intensity?: number | null
          notes?: string | null
          occurred_at?: string
          updated_at?: string
          user_id?: string
          workout_type?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          body: string
          created_at: string
          deleted_at: string | null
          energy: number | null
          entry_date: string
          id: string
          is_private: boolean
          kind: string
          life_area_id: string | null
          mood: number | null
          title: string | null
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          body?: string
          created_at?: string
          deleted_at?: string | null
          energy?: number | null
          entry_date?: string
          id?: string
          is_private?: boolean
          kind?: string
          life_area_id?: string | null
          mood?: number | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          body?: string
          created_at?: string
          deleted_at?: string | null
          energy?: number | null
          entry_date?: string
          id?: string
          is_private?: boolean
          kind?: string
          life_area_id?: string | null
          mood?: number | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "life_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "v_life_area_summary"
            referencedColumns: ["life_area_id"]
          },
        ]
      }
      life_areas: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          key: string
          name: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          key: string
          name: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          key?: string
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lrn_cards: {
        Row: {
          audio_checked_at: string | null
          audio_url: string | null
          created_at: string
          deck_id: string
          deleted_at: string | null
          difficulty: number | null
          due_at: string
          example: string | null
          example_meaning: string | null
          id: string
          image_credit: string | null
          image_path: string | null
          lapses: number
          last_review_at: string | null
          meaning: string
          notes: string | null
          pronunciation: string | null
          reps: number
          stability: number | null
          state: number
          step: number
          term: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          audio_checked_at?: string | null
          audio_url?: string | null
          created_at?: string
          deck_id: string
          deleted_at?: string | null
          difficulty?: number | null
          due_at?: string
          example?: string | null
          example_meaning?: string | null
          id?: string
          image_credit?: string | null
          image_path?: string | null
          lapses?: number
          last_review_at?: string | null
          meaning: string
          notes?: string | null
          pronunciation?: string | null
          reps?: number
          stability?: number | null
          state?: number
          step?: number
          term: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          audio_checked_at?: string | null
          audio_url?: string | null
          created_at?: string
          deck_id?: string
          deleted_at?: string | null
          difficulty?: number | null
          due_at?: string
          example?: string | null
          example_meaning?: string | null
          id?: string
          image_credit?: string | null
          image_path?: string | null
          lapses?: number
          last_review_at?: string | null
          meaning?: string
          notes?: string | null
          pronunciation?: string | null
          reps?: number
          stability?: number | null
          state?: number
          step?: number
          term?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lrn_cards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "lrn_decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lrn_cards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "v_deck_stats"
            referencedColumns: ["deck_id"]
          },
        ]
      }
      lrn_courses: {
        Row: {
          certificate_url: string | null
          completed_on: string | null
          created_at: string
          deleted_at: string | null
          est_hours: number | null
          fin_transaction_id: string | null
          format: string
          goal_id: string | null
          id: string
          provider: string | null
          skill_id: string | null
          started_on: string | null
          status: string
          title: string
          updated_at: string
          url: string | null
          user_id: string
        }
        ComputedFields: never
        Insert: {
          certificate_url?: string | null
          completed_on?: string | null
          created_at?: string
          deleted_at?: string | null
          est_hours?: number | null
          fin_transaction_id?: string | null
          format?: string
          goal_id?: string | null
          id?: string
          provider?: string | null
          skill_id?: string | null
          started_on?: string | null
          status?: string
          title: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Update: {
          certificate_url?: string | null
          completed_on?: string | null
          created_at?: string
          deleted_at?: string | null
          est_hours?: number | null
          fin_transaction_id?: string | null
          format?: string
          goal_id?: string | null
          id?: string
          provider?: string | null
          skill_id?: string | null
          started_on?: string | null
          status?: string
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lrn_courses_fin_transaction_id_fkey"
            columns: ["fin_transaction_id"]
            isOneToOne: false
            referencedRelation: "fin_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lrn_courses_fin_transaction_id_fkey"
            columns: ["fin_transaction_id"]
            isOneToOne: false
            referencedRelation: "v_transactions_base"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lrn_courses_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lrn_courses_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "v_goal_progress"
            referencedColumns: ["goal_id"]
          },
          {
            foreignKeyName: "lrn_courses_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lrn_courses_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "v_skill_levels"
            referencedColumns: ["skill_id"]
          },
        ]
      }
      lrn_decks: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          language: string
          name: string
          new_per_day: number
          skill_id: string | null
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          language?: string
          name: string
          new_per_day?: number
          skill_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          language?: string
          name?: string
          new_per_day?: number
          skill_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lrn_decks_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lrn_decks_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "v_skill_levels"
            referencedColumns: ["skill_id"]
          },
        ]
      }
      lrn_preferences: {
        Row: {
          created_at: string
          daily_review_goal: number
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          daily_review_goal?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          daily_review_goal?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lrn_reviews: {
        Row: {
          card_id: string
          created_at: string
          deck_id: string
          duration_ms: number | null
          id: string
          interval_days: number | null
          mode: string
          rating: number
          reviewed_at: string
          state_before: number
          user_id: string
        }
        ComputedFields: never
        Insert: {
          card_id: string
          created_at?: string
          deck_id: string
          duration_ms?: number | null
          id?: string
          interval_days?: number | null
          mode?: string
          rating: number
          reviewed_at?: string
          state_before: number
          user_id?: string
        }
        Update: {
          card_id?: string
          created_at?: string
          deck_id?: string
          duration_ms?: number | null
          id?: string
          interval_days?: number | null
          mode?: string
          rating?: number
          reviewed_at?: string
          state_before?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lrn_reviews_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "lrn_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lrn_reviews_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "lrn_decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lrn_reviews_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "v_deck_stats"
            referencedColumns: ["deck_id"]
          },
        ]
      }
      lrn_study_sessions: {
        Row: {
          course_id: string | null
          created_at: string
          deck_id: string | null
          deleted_at: string | null
          duration_min: number
          focus_rating: number | null
          id: string
          notes: string | null
          occurred_at: string
          skill_id: string | null
          topic: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          course_id?: string | null
          created_at?: string
          deck_id?: string | null
          deleted_at?: string | null
          duration_min: number
          focus_rating?: number | null
          id?: string
          notes?: string | null
          occurred_at?: string
          skill_id?: string | null
          topic: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          deck_id?: string | null
          deleted_at?: string | null
          duration_min?: number
          focus_rating?: number | null
          id?: string
          notes?: string | null
          occurred_at?: string
          skill_id?: string | null
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lrn_study_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "lrn_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lrn_study_sessions_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "lrn_decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lrn_study_sessions_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "v_deck_stats"
            referencedColumns: ["deck_id"]
          },
          {
            foreignKeyName: "lrn_study_sessions_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lrn_study_sessions_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "v_skill_levels"
            referencedColumns: ["skill_id"]
          },
        ]
      }
      metric_entries: {
        Row: {
          activity_log_id: string | null
          created_at: string
          deleted_at: string | null
          id: string
          metric_id: string
          note: string | null
          recorded_at: string
          updated_at: string
          user_id: string
          value: number
        }
        ComputedFields: never
        Insert: {
          activity_log_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          metric_id: string
          note?: string | null
          recorded_at?: string
          updated_at?: string
          user_id?: string
          value: number
        }
        Update: {
          activity_log_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          metric_id?: string
          note?: string | null
          recorded_at?: string
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "metric_entries_activity_log_fk"
            columns: ["activity_log_id"]
            isOneToOne: false
            referencedRelation: "activity_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_entries_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "metrics"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics: {
        Row: {
          aggregation: string
          created_at: string
          deleted_at: string | null
          derived_key: string | null
          direction: string
          id: string
          is_archived: boolean
          life_area_id: string | null
          name: string
          period: string | null
          source: string
          unit: string | null
          updated_at: string
          user_id: string
          value_type: string
        }
        ComputedFields: never
        Insert: {
          aggregation?: string
          created_at?: string
          deleted_at?: string | null
          derived_key?: string | null
          direction?: string
          id?: string
          is_archived?: boolean
          life_area_id?: string | null
          name: string
          period?: string | null
          source?: string
          unit?: string | null
          updated_at?: string
          user_id?: string
          value_type?: string
        }
        Update: {
          aggregation?: string
          created_at?: string
          deleted_at?: string | null
          derived_key?: string | null
          direction?: string
          id?: string
          is_archived?: boolean
          life_area_id?: string | null
          name?: string
          period?: string | null
          source?: string
          unit?: string | null
          updated_at?: string
          user_id?: string
          value_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "metrics_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "life_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metrics_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "v_life_area_summary"
            referencedColumns: ["life_area_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          currency: string
          display_name: string | null
          locale: string
          timezone: string
          updated_at: string
          user_id: string
          week_starts_on: number
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          currency?: string
          display_name?: string | null
          locale?: string
          timezone?: string
          updated_at?: string
          user_id: string
          week_starts_on?: number
        }
        Update: {
          created_at?: string
          currency?: string
          display_name?: string | null
          locale?: string
          timezone?: string
          updated_at?: string
          user_id?: string
          week_starts_on?: number
        }
        Relationships: []
      }
      projects: {
        Row: {
          completed_at: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          goal_id: string | null
          id: string
          life_area_id: string
          start_date: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          goal_id?: string | null
          id?: string
          life_area_id: string
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          goal_id?: string | null
          id?: string
          life_area_id?: string
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "v_goal_progress"
            referencedColumns: ["goal_id"]
          },
          {
            foreignKeyName: "projects_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "life_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "v_life_area_summary"
            referencedColumns: ["life_area_id"]
          },
        ]
      }
      rel_event_contacts: {
        Row: {
          contact_id: string
          created_at: string
          event_id: string
          id: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          contact_id: string
          created_at?: string
          event_id: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          event_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rel_event_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rel_event_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "v_contact_last_interaction"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "rel_event_contacts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      rel_interaction_contacts: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          interaction_id: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          interaction_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          interaction_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rel_interaction_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rel_interaction_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "v_contact_last_interaction"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "rel_interaction_contacts_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "rel_interactions"
            referencedColumns: ["id"]
          },
        ]
      }
      rel_interactions: {
        Row: {
          created_at: string
          deleted_at: string | null
          duration_min: number | null
          id: string
          kind: string
          notes: string | null
          occurred_at: string
          quality: number | null
          title: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          deleted_at?: string | null
          duration_min?: number | null
          id?: string
          kind?: string
          notes?: string | null
          occurred_at?: string
          quality?: number | null
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          duration_min?: number | null
          id?: string
          kind?: string
          notes?: string | null
          occurred_at?: string
          quality?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rel_milestones: {
        Row: {
          contact_id: string
          created_at: string
          deleted_at: string | null
          id: string
          kind: string
          notes: string | null
          occurred_on: string
          recurs_yearly: boolean
          title: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          contact_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          kind?: string
          notes?: string | null
          occurred_on: string
          recurs_yearly?: boolean
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          kind?: string
          notes?: string | null
          occurred_on?: string
          recurs_yearly?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rel_milestones_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rel_milestones_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "v_contact_last_interaction"
            referencedColumns: ["contact_id"]
          },
        ]
      }
      review_area_scores: {
        Row: {
          created_at: string
          id: string
          life_area_id: string
          note: string | null
          review_id: string
          score: number
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          id?: string
          life_area_id: string
          note?: string | null
          review_id: string
          score: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          life_area_id?: string
          note?: string | null
          review_id?: string
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_area_scores_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "life_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_area_scores_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "v_life_area_summary"
            referencedColumns: ["life_area_id"]
          },
          {
            foreignKeyName: "review_area_scores_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          challenges: string | null
          completed_at: string | null
          created_at: string
          id: string
          lessons: string | null
          next_focus: string | null
          overall_score: number | null
          period_end: string
          period_start: string
          period_type: string
          status: string
          updated_at: string
          user_id: string
          wins: string | null
        }
        ComputedFields: never
        Insert: {
          challenges?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lessons?: string | null
          next_focus?: string | null
          overall_score?: number | null
          period_end: string
          period_start: string
          period_type: string
          status?: string
          updated_at?: string
          user_id?: string
          wins?: string | null
        }
        Update: {
          challenges?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lessons?: string | null
          next_focus?: string | null
          overall_score?: number | null
          period_end?: string
          period_start?: string
          period_type?: string
          status?: string
          updated_at?: string
          user_id?: string
          wins?: string | null
        }
        Relationships: []
      }
      skill_assessments: {
        Row: {
          assessed_on: string
          created_at: string
          evidence: string | null
          id: string
          level: number
          skill_id: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          assessed_on?: string
          created_at?: string
          evidence?: string | null
          id?: string
          level: number
          skill_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          assessed_on?: string
          created_at?: string
          evidence?: string | null
          id?: string
          level?: number
          skill_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_assessments_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_assessments_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "v_skill_levels"
            referencedColumns: ["skill_id"]
          },
        ]
      }
      skills: {
        Row: {
          category: string | null
          created_at: string
          deleted_at: string | null
          id: string
          life_area_id: string | null
          name: string
          notes: string | null
          target_level: number | null
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          life_area_id?: string | null
          name: string
          notes?: string | null
          target_level?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          life_area_id?: string | null
          name?: string
          notes?: string | null
          target_level?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "life_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skills_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "v_life_area_summary"
            referencedColumns: ["life_area_id"]
          },
        ]
      }
      taggings: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          tag_id: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          tag_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          tag_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "taggings_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          deleted_at: string | null
          due_date: string | null
          goal_id: string | null
          id: string
          life_area_id: string
          notes: string | null
          parent_task_id: string | null
          priority: number
          project_id: string | null
          recurrence_rule: string | null
          scheduled_for: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          due_date?: string | null
          goal_id?: string | null
          id?: string
          life_area_id: string
          notes?: string | null
          parent_task_id?: string | null
          priority?: number
          project_id?: string | null
          recurrence_rule?: string | null
          scheduled_for?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          due_date?: string | null
          goal_id?: string | null
          id?: string
          life_area_id?: string
          notes?: string | null
          parent_task_id?: string | null
          priority?: number
          project_id?: string | null
          recurrence_rule?: string | null
          scheduled_for?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "v_goal_progress"
            referencedColumns: ["goal_id"]
          },
          {
            foreignKeyName: "tasks_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "life_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "v_life_area_summary"
            referencedColumns: ["life_area_id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_account_balances: {
        Row: {
          account_id: string | null
          account_type: string | null
          balance: number | null
          currency: string | null
          fx_rate_today: number | null
          include_in_net_worth: boolean | null
          name: string | null
          user_id: string | null
        }
        ComputedFields: never
        Relationships: []
      }
      v_asset_current_values: {
        Row: {
          asset_id: string | null
          category: string | null
          currency: string | null
          current_value: number | null
          current_value_base: number | null
          kind: string | null
          name: string | null
          user_id: string | null
          valued_on: string | null
        }
        ComputedFields: never
        Relationships: []
      }
      v_budget_status: {
        Row: {
          budget: number | null
          budget_id: string | null
          category: string | null
          month: string | null
          spent: number | null
          used_pct: number | null
          user_id: string | null
        }
        ComputedFields: never
        Relationships: []
      }
      v_contact_last_interaction: {
        Row: {
          contact_id: string | null
          days_since: number | null
          desired_contact_days: number | null
          full_name: string | null
          is_family: boolean | null
          is_overdue: boolean | null
          last_interaction_at: string | null
          user_id: string | null
        }
        ComputedFields: never
        Relationships: []
      }
      v_deck_stats: {
        Row: {
          deck_id: string | null
          due_now: number | null
          known: number | null
          learning: number | null
          new_cards: number | null
          total: number | null
          user_id: string | null
          young: number | null
        }
        ComputedFields: never
        Relationships: []
      }
      v_derived_metric_values: {
        Row: {
          derived_key: string | null
          period_start: string | null
          user_id: string | null
          value: number | null
        }
        ComputedFields: never
        Relationships: []
      }
      v_finance_monthly: {
        Row: {
          expense: number | null
          income: number | null
          missing_rates: number | null
          month: string | null
          net: number | null
          savings_rate_pct: number | null
          user_id: string | null
        }
        ComputedFields: never
        Relationships: []
      }
      v_goal_progress: {
        Row: {
          baseline_value: number | null
          current_value: number | null
          goal_id: string | null
          life_area_id: string | null
          progress: number | null
          status: string | null
          target_date: string | null
          target_value: number | null
          tasks_done: number | null
          tasks_total: number | null
          time_elapsed: number | null
          title: string | null
          user_id: string | null
        }
        ComputedFields: never
        Relationships: [
          {
            foreignKeyName: "goals_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "life_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "v_life_area_summary"
            referencedColumns: ["life_area_id"]
          },
        ]
      }
      v_habit_this_week: {
        Row: {
          cadence: string | null
          done_this_week: number | null
          habit_id: string | null
          life_area_id: string | null
          title: string | null
          user_id: string | null
          weekly_target: number | null
        }
        ComputedFields: never
        Relationships: [
          {
            foreignKeyName: "habits_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "life_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habits_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "v_life_area_summary"
            referencedColumns: ["life_area_id"]
          },
        ]
      }
      v_life_area_summary: {
        Row: {
          active_goals: number | null
          avg_goal_progress: number | null
          key: string | null
          last_activity_at: string | null
          last_score: number | null
          life_area_id: string | null
          logs_7d: number | null
          minutes_7d: number | null
          name: string | null
          previous_score: number | null
          sort_order: number | null
          user_id: string | null
        }
        ComputedFields: never
        Insert: {
          active_goals?: never
          avg_goal_progress?: never
          key?: string | null
          last_activity_at?: never
          last_score?: never
          life_area_id?: string | null
          logs_7d?: never
          minutes_7d?: never
          name?: string | null
          previous_score?: never
          sort_order?: number | null
          user_id?: string | null
        }
        Update: {
          active_goals?: never
          avg_goal_progress?: never
          key?: string | null
          last_activity_at?: never
          last_score?: never
          life_area_id?: string | null
          logs_7d?: never
          minutes_7d?: never
          name?: string | null
          previous_score?: never
          sort_order?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      v_metric_latest: {
        Row: {
          metric_id: string | null
          period_start: string | null
          user_id: string | null
          value: number | null
        }
        ComputedFields: never
        Relationships: []
      }
      v_metric_series: {
        Row: {
          metric_id: string | null
          period_start: string | null
          user_id: string | null
          value: number | null
        }
        ComputedFields: never
        Relationships: []
      }
      v_net_worth: {
        Row: {
          currency: string | null
          missing_rates: number | null
          net_worth: number | null
          user_id: string | null
        }
        ComputedFields: never
        Insert: {
          currency?: string | null
          missing_rates?: never
          net_worth?: never
          user_id?: string | null
        }
        Update: {
          currency?: string | null
          missing_rates?: never
          net_worth?: never
          user_id?: string | null
        }
        Relationships: []
      }
      v_skill_levels: {
        Row: {
          assessed_on: string | null
          category: string | null
          current_level: number | null
          name: string | null
          skill_id: string | null
          study_minutes: number | null
          target_level: number | null
          user_id: string | null
        }
        ComputedFields: never
        Relationships: []
      }
      v_transactions_base: {
        Row: {
          account_id: string | null
          amount: number | null
          amount_base: number | null
          category_id: string | null
          contact_id: string | null
          created_at: string | null
          currency: string | null
          deleted_at: string | null
          goal_id: string | null
          id: string | null
          import_ref: string | null
          note: string | null
          occurred_on: string | null
          payee: string | null
          transfer_account_id: string | null
          transfer_amount: number | null
          txn_type: string | null
          updated_at: string | null
          user_id: string | null
        }
        ComputedFields: never
        Relationships: [
          {
            foreignKeyName: "fin_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "fin_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_account_balances"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "fin_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "fin_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_transactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_transactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "v_contact_last_interaction"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "fin_transactions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_transactions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "v_goal_progress"
            referencedColumns: ["goal_id"]
          },
          {
            foreignKeyName: "fin_transactions_transfer_account_id_fkey"
            columns: ["transfer_account_id"]
            isOneToOne: false
            referencedRelation: "fin_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_transactions_transfer_account_id_fkey"
            columns: ["transfer_account_id"]
            isOneToOne: false
            referencedRelation: "v_account_balances"
            referencedColumns: ["account_id"]
          },
        ]
      }
      v_vocab_daily: {
        Row: {
          day: string | null
          duration_ms: number | null
          forgotten: number | null
          new_cards: number | null
          reviews: number | null
          user_id: string | null
        }
        ComputedFields: never
        Relationships: []
      }
    }
    Functions: {
      fx_rate: {
        Args: { p_currency: string; p_on: string; p_user: string }
        Returns: number
      }
      period_summary: {
        Args: { p_end: string; p_start: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
