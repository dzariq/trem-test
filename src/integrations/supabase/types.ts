export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      academic_periods: {
        Row: {
          academic_year: number | null
          campus_code: string | null
          code: string
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean
          is_open_for_grading: boolean
          name: string
          sort_order: number | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          academic_year?: number | null
          campus_code?: string | null
          code: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          is_open_for_grading?: boolean
          name: string
          sort_order?: number | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          academic_year?: number | null
          campus_code?: string | null
          code?: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          is_open_for_grading?: boolean
          name?: string
          sort_order?: number | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      admission_data: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      admission_events: {
        Row: {
          academic_year: number
          campus_id: string | null
          class_year_id: number | null
          created_at: string
          created_by: string | null
          event_date: string
          event_type: string
          id: string
          previous_school: string | null
          remarks: string | null
          student_id: string | null
          updated_at: string
          year_level: string | null
        }
        Insert: {
          academic_year?: number
          campus_id?: string | null
          class_year_id?: number | null
          created_at?: string
          created_by?: string | null
          event_date?: string
          event_type: string
          id?: string
          previous_school?: string | null
          remarks?: string | null
          student_id?: string | null
          updated_at?: string
          year_level?: string | null
        }
        Update: {
          academic_year?: number
          campus_id?: string | null
          class_year_id?: number | null
          created_at?: string
          created_by?: string | null
          event_date?: string
          event_type?: string
          id?: string
          previous_school?: string | null
          remarks?: string | null
          student_id?: string | null
          updated_at?: string
          year_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admission_events_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admission_events_class_year_id_fkey"
            columns: ["class_year_id"]
            isOneToOne: false
            referencedRelation: "class_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admission_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      admission_manual_entries: {
        Row: {
          add_stud_entered: number | null
          add_stud_start: number | null
          campus_id: string | null
          created_at: string
          current_headcount: number | null
          id: string
          minus_stud_stop: number | null
          month_start: string
          potential_students: number | null
          remarks: string | null
          updated_at: string
          withdrawals_names: string | null
        }
        Insert: {
          add_stud_entered?: number | null
          add_stud_start?: number | null
          campus_id?: string | null
          created_at?: string
          current_headcount?: number | null
          id?: string
          minus_stud_stop?: number | null
          month_start: string
          potential_students?: number | null
          remarks?: string | null
          updated_at?: string
          withdrawals_names?: string | null
        }
        Update: {
          add_stud_entered?: number | null
          add_stud_start?: number | null
          campus_id?: string | null
          created_at?: string
          current_headcount?: number | null
          id?: string
          minus_stud_stop?: number | null
          month_start?: string
          potential_students?: number | null
          remarks?: string | null
          updated_at?: string
          withdrawals_names?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admission_manual_entries_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_attachments: {
        Row: {
          announcement_id: string
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          is_primary: boolean
          storage_path: string | null
        }
        Insert: {
          announcement_id: string
          created_at?: string
          file_name: string
          file_size?: number
          file_type: string
          file_url: string
          id?: string
          is_primary?: boolean
          storage_path?: string | null
        }
        Update: {
          announcement_id?: string
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          is_primary?: boolean
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcement_attachments_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_reads: {
        Row: {
          acknowledged: boolean
          acknowledged_at: string | null
          announcement_id: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          announcement_id: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          announcement_id?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "announcement_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_teacher_public"
            referencedColumns: ["user_id"]
          },
        ]
      }
      announcement_targets: {
        Row: {
          announcement_id: string
          campus_code: string | null
          campus_id: string | null
          created_at: string
          id: string
          target_type: string
          target_value: string | null
        }
        Insert: {
          announcement_id: string
          campus_code?: string | null
          campus_id?: string | null
          created_at?: string
          id?: string
          target_type: string
          target_value?: string | null
        }
        Update: {
          announcement_id?: string
          campus_code?: string | null
          campus_id?: string | null
          created_at?: string
          id?: string
          target_type?: string
          target_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcement_targets_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_targets_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          campus_code: string | null
          campus_id: string | null
          content: string
          created_at: string
          created_by: string
          expires_at: string | null
          featured_at: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          is_pinned: boolean
          pin_order: number | null
          pinned_at: string | null
          priority: string
          published_at: string | null
          requires_acknowledgement: boolean
          scheduled_at: string | null
          status: string
          target_roles: string[]
          title: string
          updated_at: string
        }
        Insert: {
          campus_code?: string | null
          campus_id?: string | null
          content: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          featured_at?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_pinned?: boolean
          pin_order?: number | null
          pinned_at?: string | null
          priority?: string
          published_at?: string | null
          requires_acknowledgement?: boolean
          scheduled_at?: string | null
          status?: string
          target_roles?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          campus_code?: string | null
          campus_id?: string | null
          content?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          featured_at?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_pinned?: boolean
          pin_order?: number | null
          pinned_at?: string | null
          priority?: string
          published_at?: string | null
          requires_acknowledgement?: boolean
          scheduled_at?: string | null
          status?: string
          target_roles?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          campus_code: string | null
          class: string
          created_at: string | null
          date: string
          id: string
          remarks: string | null
          status: string
          student_id: string
          student_name: string | null
          updated_at: string | null
        }
        Insert: {
          campus_code?: string | null
          class: string
          created_at?: string | null
          date: string
          id?: string
          remarks?: string | null
          status: string
          student_id: string
          student_name?: string | null
          updated_at?: string | null
        }
        Update: {
          campus_code?: string | null
          class?: string
          created_at?: string | null
          date?: string
          id?: string
          remarks?: string | null
          status?: string
          student_id?: string
          student_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      behavioral_assessments: {
        Row: {
          academic_period_id: string
          achievement_text: string | null
          attendance_rating: string | null
          cooperation_rating: string | null
          created_at: string
          homeroom_teacher_comment: string | null
          id: string
          initiative_rating: string | null
          leadership_rating: string | null
          punctuality_rating: string | null
          responsibility_rating: string | null
          responsibility_text: string | null
          self_control_rating: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          academic_period_id: string
          achievement_text?: string | null
          attendance_rating?: string | null
          cooperation_rating?: string | null
          created_at?: string
          homeroom_teacher_comment?: string | null
          id?: string
          initiative_rating?: string | null
          leadership_rating?: string | null
          punctuality_rating?: string | null
          responsibility_rating?: string | null
          responsibility_text?: string | null
          self_control_rating?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          academic_period_id?: string
          achievement_text?: string | null
          attendance_rating?: string | null
          cooperation_rating?: string | null
          created_at?: string
          homeroom_teacher_comment?: string | null
          id?: string
          initiative_rating?: string | null
          leadership_rating?: string | null
          punctuality_rating?: string | null
          responsibility_rating?: string | null
          responsibility_text?: string | null
          self_control_rating?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "behavioral_assessments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      bug_report_attachments: {
        Row: {
          bug_id: string
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          mime_type: string | null
        }
        Insert: {
          bug_id: string
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          mime_type?: string | null
        }
        Update: {
          bug_id?: string
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          mime_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bug_report_attachments_bug_id_fkey"
            columns: ["bug_id"]
            isOneToOne: false
            referencedRelation: "bug_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      bug_report_comments: {
        Row: {
          author_id: string
          bug_id: string
          comment: string
          created_at: string
          id: string
        }
        Insert: {
          author_id: string
          bug_id: string
          comment: string
          created_at?: string
          id?: string
        }
        Update: {
          author_id?: string
          bug_id?: string
          comment?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bug_report_comments_bug_id_fkey"
            columns: ["bug_id"]
            isOneToOne: false
            referencedRelation: "bug_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      bug_report_status_history: {
        Row: {
          bug_id: string
          changed_by: string
          created_at: string
          id: string
          new_status: string
          old_status: string
        }
        Insert: {
          bug_id: string
          changed_by: string
          created_at?: string
          id?: string
          new_status: string
          old_status: string
        }
        Update: {
          bug_id?: string
          changed_by?: string
          created_at?: string
          id?: string
          new_status?: string
          old_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bug_report_status_history_bug_id_fkey"
            columns: ["bug_id"]
            isOneToOne: false
            referencedRelation: "bug_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      bug_reports: {
        Row: {
          actual_result: string | null
          assigned_to: string | null
          category: string
          created_at: string
          created_by: string
          environment: Json | null
          expected_result: string | null
          id: string
          module: string | null
          resolution_notes: string | null
          severity: string
          status: string
          steps_to_reproduce: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_result?: string | null
          assigned_to?: string | null
          category?: string
          created_at?: string
          created_by: string
          environment?: Json | null
          expected_result?: string | null
          id?: string
          module?: string | null
          resolution_notes?: string | null
          severity?: string
          status?: string
          steps_to_reproduce: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_result?: string | null
          assigned_to?: string | null
          category?: string
          created_at?: string
          created_by?: string
          environment?: Json | null
          expected_result?: string | null
          id?: string
          module?: string | null
          resolution_notes?: string | null
          severity?: string
          status?: string
          steps_to_reproduce?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bukku_accounts_cache: {
        Row: {
          data: Json
          fetched_at: string
          id: number
        }
        Insert: {
          data: Json
          fetched_at?: string
          id?: number
        }
        Update: {
          data?: Json
          fetched_at?: string
          id?: number
        }
        Relationships: []
      }
      bukku_contact_sync_queue: {
        Row: {
          attempts: number
          bukku_contact_id: string | null
          created_at: string
          enqueued_at: string
          enqueued_by: string | null
          finished_at: string | null
          id: string
          last_error: string | null
          payload: Json
          started_at: string | null
          status: string
          student_id: string
          updated_at: string
          webhook_response: Json | null
        }
        Insert: {
          attempts?: number
          bukku_contact_id?: string | null
          created_at?: string
          enqueued_at?: string
          enqueued_by?: string | null
          finished_at?: string | null
          id?: string
          last_error?: string | null
          payload: Json
          started_at?: string | null
          status?: string
          student_id: string
          updated_at?: string
          webhook_response?: Json | null
        }
        Update: {
          attempts?: number
          bukku_contact_id?: string | null
          created_at?: string
          enqueued_at?: string
          enqueued_by?: string | null
          finished_at?: string | null
          id?: string
          last_error?: string | null
          payload?: Json
          started_at?: string | null
          status?: string
          student_id?: string
          updated_at?: string
          webhook_response?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "bukku_contact_sync_queue_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      bukku_contacts: {
        Row: {
          bukku_contact_id: string | null
          id: string
          student_id: string
          synced_at: string | null
        }
        Insert: {
          bukku_contact_id?: string | null
          id?: string
          student_id: string
          synced_at?: string | null
        }
        Update: {
          bukku_contact_id?: string | null
          id?: string
          student_id?: string
          synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bukku_contacts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      bukku_contacts_ic_mismatched: {
        Row: {
          bukku_contact_id: string | null
          id: string
          student_id: string
          synced_at: string | null
        }
        Insert: {
          bukku_contact_id?: string | null
          id?: string
          student_id: string
          synced_at?: string | null
        }
        Update: {
          bukku_contact_id?: string | null
          id?: string
          student_id?: string
          synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bukku_contacts_not_synced_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      bukku_fields: {
        Row: {
          created_at: string
          field_id: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_id?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          field_id?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      bukku_numbers: {
        Row: {
          campus: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          campus: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          campus?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      bukku_payment_method: {
        Row: {
          account_id: number | null
          bukku_id: number
          created_at: string
          fee_account_id: number | null
          fee_text: string | null
          id: string
          is_archived: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          account_id?: number | null
          bukku_id: number
          created_at?: string
          fee_account_id?: number | null
          fee_text?: string | null
          id?: string
          is_archived?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          account_id?: number | null
          bukku_id?: number
          created_at?: string
          fee_account_id?: number | null
          fee_text?: string | null
          id?: string
          is_archived?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      bukku_products: {
        Row: {
          barcode: string | null
          bin_location: string | null
          bukku_created_at: string | null
          bukku_product_id: number | null
          bukku_updated_at: string | null
          classification_code: string | null
          created_at: string
          group_ids: string | null
          id: string
          inventory_account_id: number | null
          is_archived: boolean | null
          is_buying: boolean | null
          is_selling: boolean | null
          name: string
          picture_id: number | null
          picture_url: string | null
          purchase_account_id: number | null
          purchase_description: string | null
          purchase_prices: string | null
          purchase_tax_code_id: number | null
          quantity: number | null
          quantity_low_alert: number | null
          remarks: string | null
          sale_account_id: number | null
          sale_description: string | null
          sale_prices: string | null
          sale_tax_code_id: number | null
          sku: string | null
          synced_at: string | null
          track_inventory: boolean | null
          type: string | null
          units: string | null
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          bin_location?: string | null
          bukku_created_at?: string | null
          bukku_product_id?: number | null
          bukku_updated_at?: string | null
          classification_code?: string | null
          created_at?: string
          group_ids?: string | null
          id?: string
          inventory_account_id?: number | null
          is_archived?: boolean | null
          is_buying?: boolean | null
          is_selling?: boolean | null
          name: string
          picture_id?: number | null
          picture_url?: string | null
          purchase_account_id?: number | null
          purchase_description?: string | null
          purchase_prices?: string | null
          purchase_tax_code_id?: number | null
          quantity?: number | null
          quantity_low_alert?: number | null
          remarks?: string | null
          sale_account_id?: number | null
          sale_description?: string | null
          sale_prices?: string | null
          sale_tax_code_id?: number | null
          sku?: string | null
          synced_at?: string | null
          track_inventory?: boolean | null
          type?: string | null
          units?: string | null
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          bin_location?: string | null
          bukku_created_at?: string | null
          bukku_product_id?: number | null
          bukku_updated_at?: string | null
          classification_code?: string | null
          created_at?: string
          group_ids?: string | null
          id?: string
          inventory_account_id?: number | null
          is_archived?: boolean | null
          is_buying?: boolean | null
          is_selling?: boolean | null
          name?: string
          picture_id?: number | null
          picture_url?: string | null
          purchase_account_id?: number | null
          purchase_description?: string | null
          purchase_prices?: string | null
          purchase_tax_code_id?: number | null
          quantity?: number | null
          quantity_low_alert?: number | null
          remarks?: string | null
          sale_account_id?: number | null
          sale_description?: string | null
          sale_prices?: string | null
          sale_tax_code_id?: number | null
          sku?: string | null
          synced_at?: string | null
          track_inventory?: boolean | null
          type?: string | null
          units?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bukku_push_logs: {
        Row: {
          created_at: string
          details: Json | null
          id: string
          level: string
          message: string
          queue_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          id?: string
          level?: string
          message: string
          queue_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          id?: string
          level?: string
          message?: string
          queue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bukku_push_logs_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "bukku_push_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      bukku_push_queue: {
        Row: {
          attempts: number
          bukku_contact_id: string | null
          bukku_response: Json | null
          bukku_transaction_id: string | null
          created_at: string
          draft_id: string | null
          enqueued_at: string
          enqueued_by: string | null
          finished_at: string | null
          id: string
          last_error: string | null
          payload: Json
          started_at: string | null
          status: string
          student_id: string | null
          updated_at: string
        }
        Insert: {
          attempts?: number
          bukku_contact_id?: string | null
          bukku_response?: Json | null
          bukku_transaction_id?: string | null
          created_at?: string
          draft_id?: string | null
          enqueued_at?: string
          enqueued_by?: string | null
          finished_at?: string | null
          id?: string
          last_error?: string | null
          payload: Json
          started_at?: string | null
          status?: string
          student_id?: string | null
          updated_at?: string
        }
        Update: {
          attempts?: number
          bukku_contact_id?: string | null
          bukku_response?: Json | null
          bukku_transaction_id?: string | null
          created_at?: string
          draft_id?: string | null
          enqueued_at?: string
          enqueued_by?: string | null
          finished_at?: string | null
          id?: string
          last_error?: string | null
          payload?: Json
          started_at?: string | null
          status?: string
          student_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bukku_push_queue_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "student_invoice_draft"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bukku_push_queue_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      bukku_terms: {
        Row: {
          created_at: string
          id: string
          name: string
          term_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          term_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          term_id?: number
          updated_at?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          campus_code: string | null
          campus_id: string | null
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          event_category: string | null
          event_tags: string[] | null
          event_type: string | null
          id: string
          is_all_day: boolean | null
          is_recurring: boolean | null
          location: string | null
          recurrence_pattern: Json | null
          school_level: string | null
          start_date: string | null
          student_id: string | null
          title: string | null
          updated_at: string | null
          visibility: string | null
          visible_departments: string[] | null
          visible_user_ids: string[] | null
        }
        Insert: {
          campus_code?: string | null
          campus_id?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_category?: string | null
          event_tags?: string[] | null
          event_type?: string | null
          id?: string
          is_all_day?: boolean | null
          is_recurring?: boolean | null
          location?: string | null
          recurrence_pattern?: Json | null
          school_level?: string | null
          start_date?: string | null
          student_id?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
          visible_departments?: string[] | null
          visible_user_ids?: string[] | null
        }
        Update: {
          campus_code?: string | null
          campus_id?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_category?: string | null
          event_tags?: string[] | null
          event_type?: string | null
          id?: string
          is_all_day?: boolean | null
          is_recurring?: boolean | null
          location?: string | null
          recurrence_pattern?: Json | null
          school_level?: string | null
          start_date?: string | null
          student_id?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
          visible_departments?: string[] | null
          visible_user_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_event_category_fkey"
            columns: ["event_category"]
            isOneToOne: false
            referencedRelation: "event_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events_old: {
        Row: {
          campus_code: string | null
          campus_id: string | null
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string
          event_category: string
          event_tags: string[] | null
          event_type: string
          id: string
          is_all_day: boolean
          is_recurring: boolean
          location: string | null
          recurrence_pattern: Json | null
          school_level: string | null
          start_date: string
          student_id: string | null
          title: string
          updated_at: string
          visibility: string
          visible_departments: string[]
          visible_user_ids: string[]
        }
        Insert: {
          campus_code?: string | null
          campus_id?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date: string
          event_category?: string
          event_tags?: string[] | null
          event_type?: string
          id?: string
          is_all_day?: boolean
          is_recurring?: boolean
          location?: string | null
          recurrence_pattern?: Json | null
          school_level?: string | null
          start_date: string
          student_id?: string | null
          title: string
          updated_at?: string
          visibility?: string
          visible_departments?: string[]
          visible_user_ids?: string[]
        }
        Update: {
          campus_code?: string | null
          campus_id?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string
          event_category?: string
          event_tags?: string[] | null
          event_type?: string
          id?: string
          is_all_day?: boolean
          is_recurring?: boolean
          location?: string | null
          recurrence_pattern?: Json | null
          school_level?: string | null
          start_date?: string
          student_id?: string | null
          title?: string
          updated_at?: string
          visibility?: string
          visible_departments?: string[]
          visible_user_ids?: string[]
        }
        Relationships: []
      }
      campuses: {
        Row: {
          address: string | null
          campus_code: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          campus_code: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          campus_code?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      cca_activities: {
        Row: {
          allow_free_text: boolean
          campus_code: string | null
          category: string
          classes_involved: string[] | null
          coordinator_email: string | null
          coordinator_name: string | null
          created_at: string
          id: string
          image_url: string | null
          internal_notes: string | null
          is_active: boolean
          is_club: boolean
          location: string | null
          location_id: string | null
          max_participants: number | null
          meeting_day: string | null
          meeting_time: string | null
          name: string
          public_description: string | null
          type_id: string | null
          updated_at: string
          year_levels: string[] | null
        }
        Insert: {
          allow_free_text?: boolean
          campus_code?: string | null
          category?: string
          classes_involved?: string[] | null
          coordinator_email?: string | null
          coordinator_name?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          internal_notes?: string | null
          is_active?: boolean
          is_club?: boolean
          location?: string | null
          location_id?: string | null
          max_participants?: number | null
          meeting_day?: string | null
          meeting_time?: string | null
          name: string
          public_description?: string | null
          type_id?: string | null
          updated_at?: string
          year_levels?: string[] | null
        }
        Update: {
          allow_free_text?: boolean
          campus_code?: string | null
          category?: string
          classes_involved?: string[] | null
          coordinator_email?: string | null
          coordinator_name?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          internal_notes?: string | null
          is_active?: boolean
          is_club?: boolean
          location?: string | null
          location_id?: string | null
          max_participants?: number | null
          meeting_day?: string | null
          meeting_time?: string | null
          name?: string
          public_description?: string | null
          type_id?: string | null
          updated_at?: string
          year_levels?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "cca_activities_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "school_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cca_activities_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "cca_activity_types"
            referencedColumns: ["id"]
          },
        ]
      }
      cca_activity_teachers: {
        Row: {
          activity_id: string
          created_at: string
          id: string
          is_primary: boolean
          role: string
          teacher_user_id: string
          updated_at: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          id?: string
          is_primary?: boolean
          role?: string
          teacher_user_id: string
          updated_at?: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          role?: string
          teacher_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cca_activity_teachers_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "cca_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cca_activity_teachers_teacher_user_id_fkey"
            columns: ["teacher_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "cca_activity_teachers_teacher_user_id_fkey"
            columns: ["teacher_user_id"]
            isOneToOne: false
            referencedRelation: "v_teacher_public"
            referencedColumns: ["user_id"]
          },
        ]
      }
      cca_activity_types: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      cca_club_year_eligibility: {
        Row: {
          club_id: string
          created_at: string | null
          id: string
          year_code: string
        }
        Insert: {
          club_id: string
          created_at?: string | null
          id?: string
          year_code: string
        }
        Update: {
          club_id?: string
          created_at?: string | null
          id?: string
          year_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "cca_club_year_eligibility_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "cca_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      cca_session_enrollments: {
        Row: {
          created_at: string
          enrolled_by: string | null
          id: string
          session_id: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enrolled_by?: string | null
          id?: string
          session_id: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enrolled_by?: string | null
          id?: string
          session_id?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cca_session_enrollments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cca_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cca_session_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      cca_session_pics: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["cca_pic_role"]
          session_id: string
          teacher_user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["cca_pic_role"]
          session_id: string
          teacher_user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["cca_pic_role"]
          session_id?: string
          teacher_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cca_session_pics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cca_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cca_session_pics_teacher_user_id_fkey"
            columns: ["teacher_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "cca_session_pics_teacher_user_id_fkey"
            columns: ["teacher_user_id"]
            isOneToOne: false
            referencedRelation: "v_teacher_public"
            referencedColumns: ["user_id"]
          },
        ]
      }
      cca_sessions: {
        Row: {
          activity_id: string
          allowed_classes: string[]
          created_at: string
          custom_title: string | null
          description: string | null
          end_time: string | null
          entry_mode: string | null
          id: string
          is_cancelled: boolean
          location: string | null
          location_id: string | null
          max_participants: number | null
          requirements: string | null
          session_date: string
          session_type: string | null
          start_time: string | null
          updated_at: string
        }
        Insert: {
          activity_id: string
          allowed_classes?: string[]
          created_at?: string
          custom_title?: string | null
          description?: string | null
          end_time?: string | null
          entry_mode?: string | null
          id?: string
          is_cancelled?: boolean
          location?: string | null
          location_id?: string | null
          max_participants?: number | null
          requirements?: string | null
          session_date: string
          session_type?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          activity_id?: string
          allowed_classes?: string[]
          created_at?: string
          custom_title?: string | null
          description?: string | null
          end_time?: string | null
          entry_mode?: string | null
          id?: string
          is_cancelled?: boolean
          location?: string | null
          location_id?: string | null
          max_participants?: number | null
          requirements?: string | null
          session_date?: string
          session_type?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cca_sessions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "cca_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cca_sessions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "school_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      class_study_recommendations: {
        Row: {
          academic_period_id: string
          class_year_id: number
          created_at: string
          id: string
          recommendation: string
          subject_id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          academic_period_id: string
          class_year_id: number
          created_at?: string
          id?: string
          recommendation?: string
          subject_id: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          academic_period_id?: string
          class_year_id?: number
          created_at?: string
          id?: string
          recommendation?: string
          subject_id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_study_recommendations_academic_period_id_fkey"
            columns: ["academic_period_id"]
            isOneToOne: false
            referencedRelation: "academic_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_study_recommendations_class_year_id_fkey"
            columns: ["class_year_id"]
            isOneToOne: false
            referencedRelation: "class_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_study_recommendations_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      class_years: {
        Row: {
          active: boolean
          campus_code: string | null
          class_name: string
          color: string | null
          created_at: string
          id: number
          updated_at: string
          year_level: string
        }
        Insert: {
          active?: boolean
          campus_code?: string | null
          class_name: string
          color?: string | null
          created_at?: string
          id?: number
          updated_at?: string
          year_level: string
        }
        Update: {
          active?: boolean
          campus_code?: string | null
          class_name?: string
          color?: string | null
          created_at?: string
          id?: number
          updated_at?: string
          year_level?: string
        }
        Relationships: []
      }
      cocurricular_field_options: {
        Row: {
          category: string
          created_at: string | null
          field_label: string
          field_name: string
          id: string
          options: string[]
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          field_label: string
          field_name: string
          id?: string
          options?: string[]
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          field_label?: string
          field_name?: string
          id?: string
          options?: string[]
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      discounts: {
        Row: {
          account_id: number | null
          created_at: string
          id: string
          name: string
          payment_term_id: string | null
          product_id: string | null
          sku: string | null
          updated_at: string
        }
        Insert: {
          account_id?: number | null
          created_at?: string
          id?: string
          name: string
          payment_term_id?: string | null
          product_id?: string | null
          sku?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: number | null
          created_at?: string
          id?: string
          name?: string
          payment_term_id?: string | null
          product_id?: string | null
          sku?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discounts_payment_term_id_fkey"
            columns: ["payment_term_id"]
            isOneToOne: false
            referencedRelation: "payment_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      enquiries: {
        Row: {
          campus_preference: string | null
          contact_number: string | null
          created_at: string
          current_school: string | null
          enquiry_subject: string | null
          id: string
          message: string | null
          parent_email: string
          parent_name: string
          referral_source: string | null
          year_of_interest: string[] | null
        }
        Insert: {
          campus_preference?: string | null
          contact_number?: string | null
          created_at?: string
          current_school?: string | null
          enquiry_subject?: string | null
          id?: string
          message?: string | null
          parent_email: string
          parent_name: string
          referral_source?: string | null
          year_of_interest?: string[] | null
        }
        Update: {
          campus_preference?: string | null
          contact_number?: string | null
          created_at?: string
          current_school?: string | null
          enquiry_subject?: string | null
          id?: string
          message?: string | null
          parent_email?: string
          parent_name?: string
          referral_source?: string | null
          year_of_interest?: string[] | null
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          admission_data_id: string | null
          campus_id: string | null
          contact_number: string
          converted_to_student_id: string | null
          created_at: string
          current_school: string | null
          external_reference: string | null
          follow_up_date: string | null
          google_form_response_id: string | null
          id: string
          message: string | null
          notes: string | null
          parent_email: string | null
          parent_name: string
          source: string
          status: string
          stream_preferences: string[] | null
          submission_date: string
          updated_at: string
          year_of_interest: string[] | null
        }
        Insert: {
          admission_data_id?: string | null
          campus_id?: string | null
          contact_number: string
          converted_to_student_id?: string | null
          created_at?: string
          current_school?: string | null
          external_reference?: string | null
          follow_up_date?: string | null
          google_form_response_id?: string | null
          id?: string
          message?: string | null
          notes?: string | null
          parent_email?: string | null
          parent_name: string
          source?: string
          status?: string
          stream_preferences?: string[] | null
          submission_date?: string
          updated_at?: string
          year_of_interest?: string[] | null
        }
        Update: {
          admission_data_id?: string | null
          campus_id?: string | null
          contact_number?: string
          converted_to_student_id?: string | null
          created_at?: string
          current_school?: string | null
          external_reference?: string | null
          follow_up_date?: string | null
          google_form_response_id?: string | null
          id?: string
          message?: string | null
          notes?: string | null
          parent_email?: string | null
          parent_name?: string
          source?: string
          status?: string
          stream_preferences?: string[] | null
          submission_date?: string
          updated_at?: string
          year_of_interest?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_admission_data_id_fkey"
            columns: ["admission_data_id"]
            isOneToOne: false
            referencedRelation: "admission_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
      event_categories: {
        Row: {
          color: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          color: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      examinations: {
        Row: {
          academic_year: number
          code: string | null
          created_at: string
          dates_text: string | null
          end_date: string | null
          exam_name: string
          id: string
          sort_order: number | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          academic_year?: number
          code?: string | null
          created_at?: string
          dates_text?: string | null
          end_date?: string | null
          exam_name: string
          id?: string
          sort_order?: number | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          academic_year?: number
          code?: string | null
          created_at?: string
          dates_text?: string | null
          end_date?: string | null
          exam_name?: string
          id?: string
          sort_order?: number | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      grade_configurations: {
        Row: {
          academic_period_id: string | null
          additional_columns: Json | null
          attitude_max: number | null
          attitude_name: string | null
          class: string | null
          created_at: string | null
          exam_max: number | null
          exam_name: string | null
          homework_max: number | null
          homework_name: string | null
          id: string
          mark_types: Json | null
          quiz_max: number | null
          quiz_name: string | null
          selected_subject_ids: number[] | null
          subject_id: number | null
          updated_at: string | null
          year_level: string
        }
        Insert: {
          academic_period_id?: string | null
          additional_columns?: Json | null
          attitude_max?: number | null
          attitude_name?: string | null
          class?: string | null
          created_at?: string | null
          exam_max?: number | null
          exam_name?: string | null
          homework_max?: number | null
          homework_name?: string | null
          id?: string
          mark_types?: Json | null
          quiz_max?: number | null
          quiz_name?: string | null
          selected_subject_ids?: number[] | null
          subject_id?: number | null
          updated_at?: string | null
          year_level: string
        }
        Update: {
          academic_period_id?: string | null
          additional_columns?: Json | null
          attitude_max?: number | null
          attitude_name?: string | null
          class?: string | null
          created_at?: string | null
          exam_max?: number | null
          exam_name?: string | null
          homework_max?: number | null
          homework_name?: string | null
          id?: string
          mark_types?: Json | null
          quiz_max?: number | null
          quiz_name?: string | null
          selected_subject_ids?: number[] | null
          subject_id?: number | null
          updated_at?: string | null
          year_level?: string
        }
        Relationships: []
      }
      homework_assignment_students: {
        Row: {
          created_at: string
          homework_id: string
          id: string
          marked_at: string | null
          marked_by: string | null
          status: string
          student_id: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          homework_id: string
          id?: string
          marked_at?: string | null
          marked_by?: string | null
          status?: string
          student_id: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          homework_id?: string
          id?: string
          marked_at?: string | null
          marked_by?: string | null
          status?: string
          student_id?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_assignment_students_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "homework_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_assignment_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_assignments: {
        Row: {
          campus_code: string | null
          class_year_id: number
          created_at: string
          created_by: string
          due_date: string | null
          id: string
          instructions: string
          lesson_plan_detail_id: string | null
          subject: string
          title: string | null
          updated_at: string
        }
        Insert: {
          campus_code?: string | null
          class_year_id: number
          created_at?: string
          created_by: string
          due_date?: string | null
          id?: string
          instructions: string
          lesson_plan_detail_id?: string | null
          subject: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          campus_code?: string | null
          class_year_id?: number
          created_at?: string
          created_by?: string
          due_date?: string | null
          id?: string
          instructions?: string
          lesson_plan_detail_id?: string | null
          subject?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_assignments_class_year_id_fkey"
            columns: ["class_year_id"]
            isOneToOne: false
            referencedRelation: "class_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_assignments_lesson_plan_detail_id_fkey"
            columns: ["lesson_plan_detail_id"]
            isOneToOne: false
            referencedRelation: "lesson_plan_details"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_submissions: {
        Row: {
          class_year_id: number
          created_at: string
          id: string
          lesson_plan_detail_id: string
          marked_by: string | null
          notes: string | null
          student_id: string
          submitted: boolean
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          class_year_id: number
          created_at?: string
          id?: string
          lesson_plan_detail_id: string
          marked_by?: string | null
          notes?: string | null
          student_id: string
          submitted?: boolean
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          class_year_id?: number
          created_at?: string
          id?: string
          lesson_plan_detail_id?: string
          marked_by?: string | null
          notes?: string | null
          student_id?: string
          submitted?: boolean
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_submissions_class_year_id_fkey"
            columns: ["class_year_id"]
            isOneToOne: false
            referencedRelation: "class_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_lesson_plan_detail_id_fkey"
            columns: ["lesson_plan_detail_id"]
            isOneToOne: false
            referencedRelation: "lesson_plan_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_plan_class_assignments: {
        Row: {
          class_year_id: number
          created_at: string
          id: string
          lesson_plan_id: string
        }
        Insert: {
          class_year_id: number
          created_at?: string
          id?: string
          lesson_plan_id: string
        }
        Update: {
          class_year_id?: number
          created_at?: string
          id?: string
          lesson_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plan_class_assignments_class_year_id_fkey"
            columns: ["class_year_id"]
            isOneToOne: false
            referencedRelation: "class_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plan_class_assignments_lesson_plan_id_fkey"
            columns: ["lesson_plan_id"]
            isOneToOne: false
            referencedRelation: "lesson_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_plan_details: {
        Row: {
          approval: Json | null
          attachments: string[] | null
          attendance: Json | null
          created_at: string | null
          date: string | null
          homework: string | null
          id: string
          learning_objectives: string[] | null
          lesson_flow: Json | null
          lesson_number: number
          previous_learning: string | null
          reflection: Json | null
          resources: string | null
          subtopics: string[] | null
          teacher_names: string[] | null
          title: string
          topic: string | null
          updated_at: string | null
          vocabulary: string[] | null
          week_id: string
        }
        Insert: {
          approval?: Json | null
          attachments?: string[] | null
          attendance?: Json | null
          created_at?: string | null
          date?: string | null
          homework?: string | null
          id?: string
          learning_objectives?: string[] | null
          lesson_flow?: Json | null
          lesson_number: number
          previous_learning?: string | null
          reflection?: Json | null
          resources?: string | null
          subtopics?: string[] | null
          teacher_names?: string[] | null
          title?: string
          topic?: string | null
          updated_at?: string | null
          vocabulary?: string[] | null
          week_id: string
        }
        Update: {
          approval?: Json | null
          attachments?: string[] | null
          attendance?: Json | null
          created_at?: string | null
          date?: string | null
          homework?: string | null
          id?: string
          learning_objectives?: string[] | null
          lesson_flow?: Json | null
          lesson_number?: number
          previous_learning?: string | null
          reflection?: Json | null
          resources?: string | null
          subtopics?: string[] | null
          teacher_names?: string[] | null
          title?: string
          topic?: string | null
          updated_at?: string | null
          vocabulary?: string[] | null
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plan_details_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "lesson_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_plan_teacher_assignments: {
        Row: {
          class_year_id: number | null
          created_at: string
          id: string
          lesson_plan_id: string
          teacher_user_id: string
        }
        Insert: {
          class_year_id?: number | null
          created_at?: string
          id?: string
          lesson_plan_id: string
          teacher_user_id: string
        }
        Update: {
          class_year_id?: number | null
          created_at?: string
          id?: string
          lesson_plan_id?: string
          teacher_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plan_teacher_assignments_class_year_id_fkey"
            columns: ["class_year_id"]
            isOneToOne: false
            referencedRelation: "class_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plan_teacher_assignments_lesson_plan_id_fkey"
            columns: ["lesson_plan_id"]
            isOneToOne: false
            referencedRelation: "lesson_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plan_teacher_assignments_teacher_user_id_fkey"
            columns: ["teacher_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lesson_plan_teacher_assignments_teacher_user_id_fkey"
            columns: ["teacher_user_id"]
            isOneToOne: false
            referencedRelation: "v_teacher_public"
            referencedColumns: ["user_id"]
          },
        ]
      }
      lesson_plans: {
        Row: {
          academic_year: number
          campus_code: string | null
          class: string
          created_at: string | null
          description: string | null
          id: string
          is_master: boolean | null
          subject: string
          teacher_id: string
          term_configuration_id: string | null
          title: string | null
          updated_at: string | null
          year_level: string | null
        }
        Insert: {
          academic_year: number
          campus_code?: string | null
          class: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_master?: boolean | null
          subject: string
          teacher_id: string
          term_configuration_id?: string | null
          title?: string | null
          updated_at?: string | null
          year_level?: string | null
        }
        Update: {
          academic_year?: number
          campus_code?: string | null
          class?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_master?: boolean | null
          subject?: string
          teacher_id?: string
          term_configuration_id?: string | null
          title?: string | null
          updated_at?: string | null
          year_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plans_term_configuration_id_fkey"
            columns: ["term_configuration_id"]
            isOneToOne: false
            referencedRelation: "term_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_reflections: {
        Row: {
          areas_for_improvement: string | null
          class_year_id: number
          created_at: string
          follow_up_actions: string | null
          id: string
          learning_outcomes_achieved: boolean | null
          lesson_plan_detail_id: string
          reflection_notes: string | null
          student_engagement: string | null
          teacher_user_id: string
          updated_at: string
          what_went_well: string | null
        }
        Insert: {
          areas_for_improvement?: string | null
          class_year_id: number
          created_at?: string
          follow_up_actions?: string | null
          id?: string
          learning_outcomes_achieved?: boolean | null
          lesson_plan_detail_id: string
          reflection_notes?: string | null
          student_engagement?: string | null
          teacher_user_id: string
          updated_at?: string
          what_went_well?: string | null
        }
        Update: {
          areas_for_improvement?: string | null
          class_year_id?: number
          created_at?: string
          follow_up_actions?: string | null
          id?: string
          learning_outcomes_achieved?: boolean | null
          lesson_plan_detail_id?: string
          reflection_notes?: string | null
          student_engagement?: string | null
          teacher_user_id?: string
          updated_at?: string
          what_went_well?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_reflections_class_year_id_fkey"
            columns: ["class_year_id"]
            isOneToOne: false
            referencedRelation: "class_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_reflections_lesson_plan_detail_id_fkey"
            columns: ["lesson_plan_detail_id"]
            isOneToOne: false
            referencedRelation: "lesson_plan_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_reflections_teacher_user_id_fkey"
            columns: ["teacher_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lesson_reflections_teacher_user_id_fkey"
            columns: ["teacher_user_id"]
            isOneToOne: false
            referencedRelation: "v_teacher_public"
            referencedColumns: ["user_id"]
          },
        ]
      }
      lesson_topics: {
        Row: {
          created_at: string | null
          id: string
          lesson_plan_id: string
          subtopics: string[] | null
          title: string
          topic_order: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lesson_plan_id: string
          subtopics?: string[] | null
          title: string
          topic_order?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lesson_plan_id?: string
          subtopics?: string[] | null
          title?: string
          topic_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_topics_lesson_plan_id_fkey"
            columns: ["lesson_plan_id"]
            isOneToOne: false
            referencedRelation: "lesson_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_week_subtopics: {
        Row: {
          created_at: string | null
          id: string
          name: string
          sort_order: number
          week_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          sort_order?: number
          week_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          sort_order?: number
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_week_subtopics_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "lesson_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_weeks: {
        Row: {
          created_at: string | null
          id: string
          title: string
          topic_id: string
          updated_at: string | null
          week_number: number
          week_order: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          title: string
          topic_id: string
          updated_at?: string | null
          week_number: number
          week_order?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string
          topic_id?: string
          updated_at?: string | null
          week_number?: number
          week_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_weeks_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "lesson_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_dismissals: {
        Row: {
          dismissed_at: string
          id: string | null
          notification_id: string
          user_id: string
        }
        Insert: {
          dismissed_at?: string
          id?: string | null
          notification_id: string
          user_id: string
        }
        Update: {
          dismissed_at?: string
          id?: string | null
          notification_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_dismissals_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_reads: {
        Row: {
          notification_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          notification_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          notification_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          dedupe_key: string | null
          id: string
          is_read: boolean
          link_to: string | null
          message: string
          source_key: string | null
          target_audience: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          dedupe_key?: string | null
          id?: string
          is_read?: boolean
          link_to?: string | null
          message: string
          source_key?: string | null
          target_audience?: string
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          dedupe_key?: string | null
          id?: string
          is_read?: boolean
          link_to?: string | null
          message?: string
          source_key?: string | null
          target_audience?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      parent_tickets: {
        Row: {
          assigned_to: string | null
          attachments: Json | null
          campus: string | null
          campus_code: string | null
          contact_number: string | null
          created_at: string
          description: string
          id: string
          internal_notes: string | null
          parent_email: string | null
          parent_name: string
          praise_template: string | null
          resolved_at: string | null
          sheet_row_id: string | null
          show_on_wall: boolean | null
          status: string
          student_class: string | null
          student_name: string | null
          subject: string
          ticket_type: string
          updated_at: string
          wall_consent: boolean | null
        }
        Insert: {
          assigned_to?: string | null
          attachments?: Json | null
          campus?: string | null
          campus_code?: string | null
          contact_number?: string | null
          created_at?: string
          description: string
          id?: string
          internal_notes?: string | null
          parent_email?: string | null
          parent_name: string
          praise_template?: string | null
          resolved_at?: string | null
          sheet_row_id?: string | null
          show_on_wall?: boolean | null
          status?: string
          student_class?: string | null
          student_name?: string | null
          subject: string
          ticket_type: string
          updated_at?: string
          wall_consent?: boolean | null
        }
        Update: {
          assigned_to?: string | null
          attachments?: Json | null
          campus?: string | null
          campus_code?: string | null
          contact_number?: string | null
          created_at?: string
          description?: string
          id?: string
          internal_notes?: string | null
          parent_email?: string | null
          parent_name?: string
          praise_template?: string | null
          resolved_at?: string | null
          sheet_row_id?: string | null
          show_on_wall?: boolean | null
          status?: string
          student_class?: string | null
          student_name?: string | null
          subject?: string
          ticket_type?: string
          updated_at?: string
          wall_consent?: boolean | null
        }
        Relationships: []
      }
      parents: {
        Row: {
          created_at: string
          ic_number: string | null
          id: string
          is_malaysian: boolean
          is_primary_contact: boolean
          name: string | null
          nationality: string | null
          parent_email: string | null
          parent_user_id: string | null
          passport_expiry_date: string | null
          phone: string | null
          relationship: string | null
          updated_at: string
          visa_expiry_date: string | null
        }
        Insert: {
          created_at?: string
          ic_number?: string | null
          id?: string
          is_malaysian?: boolean
          is_primary_contact?: boolean
          name?: string | null
          nationality?: string | null
          parent_email?: string | null
          parent_user_id?: string | null
          passport_expiry_date?: string | null
          phone?: string | null
          relationship?: string | null
          updated_at?: string
          visa_expiry_date?: string | null
        }
        Update: {
          created_at?: string
          ic_number?: string | null
          id?: string
          is_malaysian?: boolean
          is_primary_contact?: boolean
          name?: string | null
          nationality?: string | null
          parent_email?: string | null
          parent_user_id?: string | null
          passport_expiry_date?: string | null
          phone?: string | null
          relationship?: string | null
          updated_at?: string
          visa_expiry_date?: string | null
        }
        Relationships: []
      }
      payment_terms: {
        Row: {
          code: string
          created_at: string
          example: string | null
          frequency: string
          id: string
          is_active: boolean
          name: string
          period_key_format: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          example?: string | null
          frequency: string
          id?: string
          is_active?: boolean
          name: string
          period_key_format: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          example?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          name?: string
          period_key_format?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      product_mapping: {
        Row: {
          account_id: number | null
          campus_code: string | null
          created_at: string
          early_lockin_discount: boolean
          frequency: string | null
          id: string
          product_id: string
          type: string
          updated_at: string
          year_levels: string[]
        }
        Insert: {
          account_id?: number | null
          campus_code?: string | null
          created_at?: string
          early_lockin_discount?: boolean
          frequency?: string | null
          id?: string
          product_id: string
          type?: string
          updated_at?: string
          year_levels?: string[]
        }
        Update: {
          account_id?: number | null
          campus_code?: string | null
          created_at?: string
          early_lockin_discount?: boolean
          frequency?: string | null
          id?: string
          product_id?: string
          type?: string
          updated_at?: string
          year_levels?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "config_term_year_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "bukku_products"
            referencedColumns: ["id"]
          },
        ]
      }
      school_holidays: {
        Row: {
          academic_year: number
          created_at: string
          dates_text: string | null
          end_date: string | null
          holiday_name: string
          holiday_type: string
          id: string
          sort_order: number | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          academic_year?: number
          created_at?: string
          dates_text?: string | null
          end_date?: string | null
          holiday_name: string
          holiday_type?: string
          id?: string
          sort_order?: number | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          academic_year?: number
          created_at?: string
          dates_text?: string | null
          end_date?: string | null
          holiday_name?: string
          holiday_type?: string
          id?: string
          sort_order?: number | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      school_locations: {
        Row: {
          building: string | null
          capacity: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          location_type: string | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          building?: string | null
          capacity?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          location_type?: string | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          building?: string | null
          capacity?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          location_type?: string | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      stock_catalogue: {
        Row: {
          category: string | null
          created_at: string
          id: string
          low_stock_threshold: number | null
          name: string
          quantity_on_hand: number
          size_variant: string | null
          sku: string | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          low_stock_threshold?: number | null
          name: string
          quantity_on_hand?: number
          size_variant?: string | null
          sku?: string | null
          unit_price?: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          low_stock_threshold?: number | null
          name?: string
          quantity_on_hand?: number
          size_variant?: string | null
          sku?: string | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          movement_type: string
          note: string | null
          quantity_after: number
          quantity_change: number
          stock_item_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type: string
          note?: string | null
          quantity_after?: number
          quantity_change?: number
          stock_item_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type?: string
          note?: string | null
          quantity_after?: number
          quantity_change?: number
          stock_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_stock_item_id_fkey"
            columns: ["stock_item_id"]
            isOneToOne: false
            referencedRelation: "stock_catalogue"
            referencedColumns: ["id"]
          },
        ]
      }
      student_campus_transfers: {
        Row: {
          created_at: string
          created_by: string | null
          from_campus_id: string | null
          id: string
          reason: string | null
          student_id: string
          to_campus_id: string
          transfer_date: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          from_campus_id?: string | null
          id?: string
          reason?: string | null
          student_id: string
          to_campus_id: string
          transfer_date: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          from_campus_id?: string | null
          id?: string
          reason?: string | null
          student_id?: string
          to_campus_id?: string
          transfer_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_campus_transfers_from_campus_id_fkey"
            columns: ["from_campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_campus_transfers_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_campus_transfers_to_campus_id_fkey"
            columns: ["to_campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
      student_cca_enrollments: {
        Row: {
          cca_activity_id: string
          created_at: string
          created_by: string | null
          id: string
          status: string
          student_id: string
        }
        Insert: {
          cca_activity_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          status?: string
          student_id: string
        }
        Update: {
          cca_activity_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_cca_enrollments_cca_activity_id_fkey"
            columns: ["cca_activity_id"]
            isOneToOne: false
            referencedRelation: "cca_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_cca_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_cocurricular_activities: {
        Row: {
          academic_period_id: string
          achievements_award: string | null
          achievements_event: string | null
          club_org: string | null
          club_role: string | null
          created_at: string
          events_org: string | null
          events_role: string | null
          id: string
          leadership_org: string | null
          leadership_role: string | null
          sports_house_org: string | null
          sports_house_role: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          academic_period_id: string
          achievements_award?: string | null
          achievements_event?: string | null
          club_org?: string | null
          club_role?: string | null
          created_at?: string
          events_org?: string | null
          events_role?: string | null
          id?: string
          leadership_org?: string | null
          leadership_role?: string | null
          sports_house_org?: string | null
          sports_house_role?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          academic_period_id?: string
          achievements_award?: string | null
          achievements_event?: string | null
          club_org?: string | null
          club_role?: string | null
          created_at?: string
          events_org?: string | null
          events_role?: string | null
          id?: string
          leadership_org?: string | null
          leadership_role?: string | null
          sports_house_org?: string | null
          sports_house_role?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_cocurricular_activities_academic_period_id_fkey"
            columns: ["academic_period_id"]
            isOneToOne: false
            referencedRelation: "academic_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_cocurricular_activities_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_grade_goals: {
        Row: {
          created_at: string
          created_by: string
          goal_year: number
          id: string
          student_id: string
          subject_id: number
          target_percentage: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          goal_year: number
          id?: string
          student_id: string
          subject_id: number
          target_percentage: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          goal_year?: number
          id?: string
          student_id?: string
          subject_id?: number
          target_percentage?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_grade_goals_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_grade_goals_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      student_grades: {
        Row: {
          academic_period_id: string
          attitude_marks: number
          created_at: string
          created_by: string | null
          exam_marks: number
          homework_marks: number
          id: string
          letter_grade: string | null
          quiz_marks: number
          student_id: string
          study_recommendation: string | null
          subject_comment: string | null
          subject_id: number
          teacher_comment: string | null
          total_marks: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          academic_period_id: string
          attitude_marks?: number
          created_at?: string
          created_by?: string | null
          exam_marks?: number
          homework_marks?: number
          id?: string
          letter_grade?: string | null
          quiz_marks?: number
          student_id: string
          study_recommendation?: string | null
          subject_comment?: string | null
          subject_id: number
          teacher_comment?: string | null
          total_marks?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          academic_period_id?: string
          attitude_marks?: number
          created_at?: string
          created_by?: string | null
          exam_marks?: number
          homework_marks?: number
          id?: string
          letter_grade?: string | null
          quiz_marks?: number
          student_id?: string
          study_recommendation?: string | null
          subject_comment?: string | null
          subject_id?: number
          teacher_comment?: string | null
          total_marks?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_grades_academic_period_id_fkey"
            columns: ["academic_period_id"]
            isOneToOne: false
            referencedRelation: "academic_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_grades_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      student_guardians: {
        Row: {
          created_at: string
          guardian_user_id: string
          id: string
          is_primary: boolean
          relationship: string | null
          student_id: string
        }
        Insert: {
          created_at?: string
          guardian_user_id: string
          id?: string
          is_primary?: boolean
          relationship?: string | null
          student_id: string
        }
        Update: {
          created_at?: string
          guardian_user_id?: string
          id?: string
          is_primary?: boolean
          relationship?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_guardians_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_id_counters: {
        Row: {
          campus_code: string
          graduation_year: number
          last_number: number
        }
        Insert: {
          campus_code: string
          graduation_year: number
          last_number?: number
        }
        Update: {
          campus_code?: string
          graduation_year?: number
          last_number?: number
        }
        Relationships: []
      }
      student_invoice_draft: {
        Row: {
          billing_party: string | null
          bukku_error: string | null
          bukku_invoice_id: string | null
          bukku_invoice_number: string | null
          bukku_status: string
          bukku_transaction_id: string | null
          cca_product_id: string | null
          created_at: string
          created_by: string | null
          currency_code: string | null
          description: string | null
          discount_name_overrides: Json | null
          discount_overrides: Json | null
          discount_product_ids: string[] | null
          due_date: string | null
          email_cc: string[] | null
          email_message: string | null
          email_subject: string | null
          email_to: string[] | null
          extra_product_ids: string[]
          id: string
          invoice_date: string | null
          invoice_number: string | null
          payload: Json | null
          payment_mode: string | null
          period_key: string | null
          product_id: string | null
          pushed_at: string | null
          quantity: number | null
          reference_number: string | null
          remarks: string | null
          send_email: boolean | null
          status: string
          student_id: string
          tax_code: string | null
          tax_mode: string | null
          title: string | null
          total_amount: number | null
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          billing_party?: string | null
          bukku_error?: string | null
          bukku_invoice_id?: string | null
          bukku_invoice_number?: string | null
          bukku_status?: string
          bukku_transaction_id?: string | null
          cca_product_id?: string | null
          created_at?: string
          created_by?: string | null
          currency_code?: string | null
          description?: string | null
          discount_name_overrides?: Json | null
          discount_overrides?: Json | null
          discount_product_ids?: string[] | null
          due_date?: string | null
          email_cc?: string[] | null
          email_message?: string | null
          email_subject?: string | null
          email_to?: string[] | null
          extra_product_ids?: string[]
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          payload?: Json | null
          payment_mode?: string | null
          period_key?: string | null
          product_id?: string | null
          pushed_at?: string | null
          quantity?: number | null
          reference_number?: string | null
          remarks?: string | null
          send_email?: boolean | null
          status?: string
          student_id: string
          tax_code?: string | null
          tax_mode?: string | null
          title?: string | null
          total_amount?: number | null
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          billing_party?: string | null
          bukku_error?: string | null
          bukku_invoice_id?: string | null
          bukku_invoice_number?: string | null
          bukku_status?: string
          bukku_transaction_id?: string | null
          cca_product_id?: string | null
          created_at?: string
          created_by?: string | null
          currency_code?: string | null
          description?: string | null
          discount_name_overrides?: Json | null
          discount_overrides?: Json | null
          discount_product_ids?: string[] | null
          due_date?: string | null
          email_cc?: string[] | null
          email_message?: string | null
          email_subject?: string | null
          email_to?: string[] | null
          extra_product_ids?: string[]
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          payload?: Json | null
          payment_mode?: string | null
          period_key?: string | null
          product_id?: string | null
          pushed_at?: string | null
          quantity?: number | null
          reference_number?: string | null
          remarks?: string | null
          send_email?: boolean | null
          status?: string
          student_id?: string
          tax_code?: string | null
          tax_mode?: string | null
          title?: string | null
          total_amount?: number | null
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_invoice_draft_cca_product_id_fkey"
            columns: ["cca_product_id"]
            isOneToOne: false
            referencedRelation: "bukku_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_invoice_draft_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "bukku_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_invoice_draft_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_invoices: {
        Row: {
          bukku_contact_id: number
          bukku_invoice_id: string | null
          content: Json
          created_at: string
          id: string
          invoice_date: string | null
          period_key: string | null
          status: string
          type: Database["public"]["Enums"]["student_invoice_type"]
          updated_at: string
          url: string | null
        }
        Insert: {
          bukku_contact_id: number
          bukku_invoice_id?: string | null
          content?: Json
          created_at?: string
          id?: string
          invoice_date?: string | null
          period_key?: string | null
          status: string
          type?: Database["public"]["Enums"]["student_invoice_type"]
          updated_at?: string
          url?: string | null
        }
        Update: {
          bukku_contact_id?: number
          bukku_invoice_id?: string | null
          content?: Json
          created_at?: string
          id?: string
          invoice_date?: string | null
          period_key?: string | null
          status?: string
          type?: Database["public"]["Enums"]["student_invoice_type"]
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      student_parent: {
        Row: {
          created_at: string
          id: string
          parent_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parent_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parent_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_parent_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_parent_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_payment_terms: {
        Row: {
          created_at: string
          effective_at: string
          id: string
          payment_term_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          effective_at: string
          id?: string
          payment_term_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          effective_at?: string
          id?: string
          payment_term_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_payment_terms_payment_term_id_fkey"
            columns: ["payment_term_id"]
            isOneToOne: false
            referencedRelation: "payment_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_payment_terms_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_siblings: {
        Row: {
          created_at: string
          id: string
          sibling_student_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          sibling_student_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          sibling_student_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_siblings_sibling_student_id_fkey"
            columns: ["sibling_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_siblings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_sport_houses: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          sport_house: string
          student_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          sport_house: string
          student_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          sport_house?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_sport_houses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          allergy_notes: string | null
          archived: boolean
          campus_code: string | null
          campus_id: string | null
          city: string | null
          class: string
          class_year_id: number | null
          country: string | null
          created_at: string
          departure_date: string | null
          departure_reason: string | null
          deposit_amount_collected: number | null
          deposit_payment_date: string | null
          deposit_refund_date: string | null
          discount_type: string | null
          dob: string | null
          early_lockin_amount: string | null
          early_lockin_discount: boolean | null
          email: string
          enrollment_date: string
          ethnicity: string | null
          family_id: string | null
          first_school_day: string | null
          gender: string | null
          graduation_year: number | null
          id: string
          info: Json | null
          insurance: string | null
          languages: string[] | null
          main_student_id: string | null
          malaysian_citizen: boolean | null
          name: string
          nationality: string | null
          parent1_email: string | null
          parent1_ic: string | null
          parent1_name: string | null
          parent1_phone: string | null
          parent1_relationship: string | null
          parent1_user_id: string | null
          parent2_email: string | null
          parent2_ic: string | null
          parent2_name: string | null
          parent2_phone: string | null
          parent2_relationship: string | null
          parent2_user_id: string | null
          passport_expiry_date: string | null
          payment_type: string | null
          postcode: string | null
          previous: string | null
          relationship_type: string | null
          remarks: string | null
          sibling_discount: boolean | null
          state: string | null
          student_code: string | null
          student_ic: string | null
          updated_at: string
          user_id: string | null
          visa_expiry_date: string | null
          year_level: string
        }
        Insert: {
          address?: string | null
          allergy_notes?: string | null
          archived?: boolean
          campus_code?: string | null
          campus_id?: string | null
          city?: string | null
          class: string
          class_year_id?: number | null
          country?: string | null
          created_at?: string
          departure_date?: string | null
          departure_reason?: string | null
          deposit_amount_collected?: number | null
          deposit_payment_date?: string | null
          deposit_refund_date?: string | null
          discount_type?: string | null
          dob?: string | null
          early_lockin_amount?: string | null
          early_lockin_discount?: boolean | null
          email: string
          enrollment_date?: string
          ethnicity?: string | null
          family_id?: string | null
          first_school_day?: string | null
          gender?: string | null
          graduation_year?: number | null
          id?: string
          info?: Json | null
          insurance?: string | null
          languages?: string[] | null
          main_student_id?: string | null
          malaysian_citizen?: boolean | null
          name: string
          nationality?: string | null
          parent1_email?: string | null
          parent1_ic?: string | null
          parent1_name?: string | null
          parent1_phone?: string | null
          parent1_relationship?: string | null
          parent1_user_id?: string | null
          parent2_email?: string | null
          parent2_ic?: string | null
          parent2_name?: string | null
          parent2_phone?: string | null
          parent2_relationship?: string | null
          parent2_user_id?: string | null
          passport_expiry_date?: string | null
          payment_type?: string | null
          postcode?: string | null
          previous?: string | null
          relationship_type?: string | null
          remarks?: string | null
          sibling_discount?: boolean | null
          state?: string | null
          student_code?: string | null
          student_ic?: string | null
          updated_at?: string
          user_id?: string | null
          visa_expiry_date?: string | null
          year_level: string
        }
        Update: {
          address?: string | null
          allergy_notes?: string | null
          archived?: boolean
          campus_code?: string | null
          campus_id?: string | null
          city?: string | null
          class?: string
          class_year_id?: number | null
          country?: string | null
          created_at?: string
          departure_date?: string | null
          departure_reason?: string | null
          deposit_amount_collected?: number | null
          deposit_payment_date?: string | null
          deposit_refund_date?: string | null
          discount_type?: string | null
          dob?: string | null
          early_lockin_amount?: string | null
          early_lockin_discount?: boolean | null
          email?: string
          enrollment_date?: string
          ethnicity?: string | null
          family_id?: string | null
          first_school_day?: string | null
          gender?: string | null
          graduation_year?: number | null
          id?: string
          info?: Json | null
          insurance?: string | null
          languages?: string[] | null
          main_student_id?: string | null
          malaysian_citizen?: boolean | null
          name?: string
          nationality?: string | null
          parent1_email?: string | null
          parent1_ic?: string | null
          parent1_name?: string | null
          parent1_phone?: string | null
          parent1_relationship?: string | null
          parent1_user_id?: string | null
          parent2_email?: string | null
          parent2_ic?: string | null
          parent2_name?: string | null
          parent2_phone?: string | null
          parent2_relationship?: string | null
          parent2_user_id?: string | null
          passport_expiry_date?: string | null
          payment_type?: string | null
          postcode?: string | null
          previous?: string | null
          relationship_type?: string | null
          remarks?: string | null
          sibling_discount?: boolean | null
          state?: string | null
          student_code?: string | null
          student_ic?: string | null
          updated_at?: string
          user_id?: string | null
          visa_expiry_date?: string | null
          year_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_students_main_student"
            columns: ["main_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_categories: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_grouped: boolean
          name: string
          parent_id: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_grouped?: boolean
          name: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_grouped?: boolean
          name?: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subject_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "subject_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_selections: {
        Row: {
          campus_code: string | null
          class: string
          created_at: string
          id: string
          remarks: string | null
          selected_subject_ids: number[] | null
          stream: string | null
          student_id: string
          student_name: string
          subjects: Json
          updated_at: string
          year_level: string
        }
        Insert: {
          campus_code?: string | null
          class: string
          created_at?: string
          id?: string
          remarks?: string | null
          selected_subject_ids?: number[] | null
          stream?: string | null
          student_id: string
          student_name: string
          subjects?: Json
          updated_at?: string
          year_level: string
        }
        Update: {
          campus_code?: string | null
          class?: string
          created_at?: string
          id?: string
          remarks?: string | null
          selected_subject_ids?: number[] | null
          stream?: string | null
          student_id?: string
          student_name?: string
          subjects?: Json
          updated_at?: string
          year_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "subject_selections_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          alternative_to: number | null
          campus_code: string | null
          category: string | null
          category_id: string | null
          class_groups: number[] | null
          code: string | null
          created_at: string
          display_order: number
          id: number
          is_compulsory: boolean | null
          name: string
          selection_group: string | null
          sub_category_id: string | null
          updated_at: string
          year_levels: string[] | null
        }
        Insert: {
          alternative_to?: number | null
          campus_code?: string | null
          category?: string | null
          category_id?: string | null
          class_groups?: number[] | null
          code?: string | null
          created_at?: string
          display_order?: number
          id?: number
          is_compulsory?: boolean | null
          name: string
          selection_group?: string | null
          sub_category_id?: string | null
          updated_at?: string
          year_levels?: string[] | null
        }
        Update: {
          alternative_to?: number | null
          campus_code?: string | null
          category?: string | null
          category_id?: string | null
          class_groups?: number[] | null
          code?: string | null
          created_at?: string
          display_order?: number
          id?: number
          is_compulsory?: boolean | null
          name?: string
          selection_group?: string | null
          sub_category_id?: string | null
          updated_at?: string
          year_levels?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "subjects_alternative_to_fkey"
            columns: ["alternative_to"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "subject_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_sub_category_id_fkey"
            columns: ["sub_category_id"]
            isOneToOne: false
            referencedRelation: "subject_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          campus: string | null
          created_at: string
          id: string
          tag_id: string
          tag_name: string
          updated_at: string
        }
        Insert: {
          campus?: string | null
          created_at?: string
          id?: string
          tag_id: string
          tag_name: string
          updated_at?: string
        }
        Update: {
          campus?: string | null
          created_at?: string
          id?: string
          tag_id?: string
          tag_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      teacher_assignments: {
        Row: {
          class_year_id: number
          created_at: string
          id: string
          subject_id: number
          teacher_id: string
        }
        Insert: {
          class_year_id: number
          created_at?: string
          id?: string
          subject_id: number
          teacher_id: string
        }
        Update: {
          class_year_id?: number
          created_at?: string
          id?: string
          subject_id?: number
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_assignments_class_year_id_fkey"
            columns: ["class_year_id"]
            isOneToOne: false
            referencedRelation: "class_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      term_configurations: {
        Row: {
          academic_year: number
          created_at: string
          end_date: string | null
          id: string
          start_date: string | null
          term_name: string
          updated_at: string
        }
        Insert: {
          academic_year: number
          created_at?: string
          end_date?: string | null
          id?: string
          start_date?: string | null
          term_name: string
          updated_at?: string
        }
        Update: {
          academic_year?: number
          created_at?: string
          end_date?: string | null
          id?: string
          start_date?: string | null
          term_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      term_week_ranges: {
        Row: {
          created_at: string
          end_date: string
          id: string
          start_date: string
          term_configuration_id: string
          updated_at: string
          week_number: number
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          start_date: string
          term_configuration_id: string
          updated_at?: string
          week_number: number
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          start_date?: string
          term_configuration_id?: string
          updated_at?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "term_week_ranges_term_configuration_id_fkey"
            columns: ["term_configuration_id"]
            isOneToOne: false
            referencedRelation: "term_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_responses: {
        Row: {
          created_at: string
          id: string
          is_internal: boolean | null
          message: string
          responder_id: string | null
          responder_name: string | null
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_internal?: boolean | null
          message: string
          responder_id?: string | null
          responder_name?: string | null
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_internal?: boolean | null
          message?: string
          responder_id?: string | null
          responder_name?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_responses_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "parent_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_campuses: {
        Row: {
          campus_code: string
          campus_id: string
          created_at: string | null
          id: string
          is_primary: boolean
          user_id: string
        }
        Insert: {
          campus_code: string
          campus_id: string
          created_at?: string | null
          id?: string
          is_primary?: boolean
          user_id: string
        }
        Update: {
          campus_code?: string
          campus_id?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_campuses_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_module_access: {
        Row: {
          can_edit: boolean
          can_manage: boolean
          can_view: boolean
          created_at: string
          id: string
          module_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_edit?: boolean
          can_manage?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          module_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_edit?: boolean
          can_manage?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          module_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          account_status: string
          assigned_campus_id: string | null
          can_access_all_campuses: boolean
          can_create_users: boolean
          can_manage_lesson_plans: boolean | null
          created_at: string
          departments: string[]
          email: string | null
          full_name: string | null
          ic_number: string | null
          id: string
          is_active: boolean
          last_sign_in_at: string | null
          login_count: number | null
          malaysian_citizen: boolean | null
          nationality: string | null
          parent_relationship: string | null
          parent_relationship_other: string | null
          passport_expiry_date: string | null
          phone: string | null
          role: string
          updated_at: string
          user_id: string
          visa_expiry_date: string | null
        }
        Insert: {
          account_status?: string
          assigned_campus_id?: string | null
          can_access_all_campuses?: boolean
          can_create_users?: boolean
          can_manage_lesson_plans?: boolean | null
          created_at?: string
          departments?: string[]
          email?: string | null
          full_name?: string | null
          ic_number?: string | null
          id?: string
          is_active?: boolean
          last_sign_in_at?: string | null
          login_count?: number | null
          malaysian_citizen?: boolean | null
          nationality?: string | null
          parent_relationship?: string | null
          parent_relationship_other?: string | null
          passport_expiry_date?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
          user_id: string
          visa_expiry_date?: string | null
        }
        Update: {
          account_status?: string
          assigned_campus_id?: string | null
          can_access_all_campuses?: boolean
          can_create_users?: boolean
          can_manage_lesson_plans?: boolean | null
          created_at?: string
          departments?: string[]
          email?: string | null
          full_name?: string | null
          ic_number?: string | null
          id?: string
          is_active?: boolean
          last_sign_in_at?: string | null
          login_count?: number | null
          malaysian_citizen?: boolean | null
          nationality?: string | null
          parent_relationship?: string | null
          parent_relationship_other?: string | null
          passport_expiry_date?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
          user_id?: string
          visa_expiry_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_assigned_campus_id_fkey"
            columns: ["assigned_campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_teacher_public: {
        Row: {
          departments: string[] | null
          full_name: string | null
          user_id: string | null
        }
        Insert: {
          departments?: string[] | null
          full_name?: string | null
          user_id?: string | null
        }
        Update: {
          departments?: string[] | null
          full_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      activate_own_account: { Args: never; Returns: undefined }
      calculate_current_headcount: {
        Args: { target_campus_id?: string; target_month_start: string }
        Returns: number
      }
      can_manage_cca_sessions: {
        Args: { p_activity_id: string }
        Returns: boolean
      }
      can_user_access_all_campuses: { Args: never; Returns: boolean }
      can_write_grades: { Args: { p_period_id: string }; Returns: boolean }
      check_phone_exists: { Args: { phone_number: string }; Returns: Json }
      current_user_role: { Args: never; Returns: string }
      generate_student_code: {
        Args: { p_campus_code: string; p_graduation_year: number }
        Returns: string
      }
      get_campus_code: { Args: { p_campus_id: string }; Returns: string }
      get_cohort_averages_by_year_level_and_period: {
        Args: { p_academic_period_id: string; p_year_level: string }
        Returns: {
          cohort_avg: number
          subject_id: number
        }[]
      }
      get_cohort_averages_by_year_level_and_period_scoped: {
        Args: { p_academic_period_id: string; p_year_level: string }
        Returns: {
          cohort_avg: number
          subject_id: number
        }[]
      }
      get_eligible_cca_activities: {
        Args: { p_student_id: string }
        Returns: {
          activity_id: string
        }[]
      }
      get_or_create_admission_entry: {
        Args: { target_campus_id?: string; target_month_start: string }
        Returns: string
      }
      get_or_create_grade_config:
        | {
            Args: {
              p_academic_period_id: string
              p_class: string
              p_mark_types?: Json
              p_year_level: string
            }
            Returns: string
          }
        | {
            Args: {
              p_academic_period_id: string
              p_class: string
              p_mark_types?: Json
              p_selected_subject_ids?: number[]
              p_year_level: string
            }
            Returns: string
          }
      get_session_enrollment_count: {
        Args: { p_session_id: string }
        Returns: number
      }
      get_student_class_year_id: {
        Args: { p_student_id: string }
        Returns: number
      }
      get_teacher_public_info: {
        Args: { p_teacher_user_id: string }
        Returns: {
          departments: string[]
          full_name: string
          user_id: string
        }[]
      }
      get_user_campus_id: { Args: never; Returns: string }
      get_user_campuses: { Args: never; Returns: string[] }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_admin_like: { Args: never; Returns: boolean }
      is_cca_session_full: { Args: { p_session_id: string }; Returns: boolean }
      is_parent: { Args: never; Returns: boolean }
      is_parent_of_student: { Args: { p_student_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      is_teacher: { Args: never; Returns: boolean }
      is_teacher_assigned_to_cca: {
        Args: { p_activity_id: string }
        Returns: boolean
      }
      is_teacher_of_class_name: {
        Args: { p_class_name: string }
        Returns: boolean
      }
      is_teacher_of_class_year: {
        Args: { p_class_year_id: number }
        Returns: boolean
      }
      is_ticket_owner: {
        Args: { ticket_parent_email: string }
        Returns: boolean
      }
      set_academic_period_status: {
        Args: { p_period_id: string; p_status: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      teacher_allowed_class_year_ids: { Args: never; Returns: number[] }
      teacher_assigned_to_cca: { Args: { _cca_id: string }; Returns: boolean }
      track_user_login: { Args: never; Returns: undefined }
      transfer_student_campus: {
        Args: {
          p_clear_class?: boolean
          p_created_by?: string
          p_from_campus_id: string
          p_reason?: string
          p_student_id: string
          p_to_campus_id: string
          p_transfer_date: string
        }
        Returns: Json
      }
      user_has_role: { Args: { check_role: string }; Returns: boolean }
      validate_cca_enrollment_eligibility: {
        Args: { p_activity_id: string; p_student_id: string }
        Returns: {
          activity_year_levels: string[]
          error_message: string
          is_eligible: boolean
          student_key_stage: string
          student_year_level: string
        }[]
      }
    }
    Enums: {
      cca_pic_role: "lead" | "sub"
      invoice_status: "pending_payment" | "paid"
      student_invoice_status: "pending_payment" | "paid" | "draft"
      student_invoice_type: "enrolment" | "fees" | "others"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      cca_pic_role: ["lead", "sub"],
      invoice_status: ["pending_payment", "paid"],
      student_invoice_status: ["pending_payment", "paid", "draft"],
      student_invoice_type: ["enrolment", "fees", "others"],
    },
  },
} as const
