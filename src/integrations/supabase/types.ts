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
        }
        Insert: {
          announcement_id: string
          created_at?: string
          file_name: string
          file_size?: number
          file_type: string
          file_url: string
          id?: string
        }
        Update: {
          announcement_id?: string
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
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
        ]
      }
      announcement_targets: {
        Row: {
          announcement_id: string
          campus_id: string | null
          created_at: string
          id: string
          target_type: string
          target_value: string | null
        }
        Insert: {
          announcement_id: string
          campus_id?: string | null
          created_at?: string
          id?: string
          target_type: string
          target_value?: string | null
        }
        Update: {
          announcement_id?: string
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
          campus_id: string | null
          content: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          is_pinned: boolean
          pin_order: number | null
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
          campus_id?: string | null
          content: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_pinned?: boolean
          pin_order?: number | null
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
          campus_id?: string | null
          content?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_pinned?: boolean
          pin_order?: number | null
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
      calendar_events: {
        Row: {
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
          category: string
          classes_involved: string[] | null
          coordinator_email: string | null
          coordinator_name: string | null
          created_at: string
          id: string
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
          category?: string
          classes_involved?: string[] | null
          coordinator_email?: string | null
          coordinator_name?: string | null
          created_at?: string
          id?: string
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
          category?: string
          classes_involved?: string[] | null
          coordinator_email?: string | null
          coordinator_name?: string | null
          created_at?: string
          id?: string
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
      cca_sessions: {
        Row: {
          activity_id: string
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
      class_years: {
        Row: {
          active: boolean
          class_name: string
          color: string | null
          created_at: string
          id: number
          updated_at: string
          year_level: string
        }
        Insert: {
          active?: boolean
          class_name: string
          color?: string | null
          created_at?: string
          id?: number
          updated_at?: string
          year_level: string
        }
        Update: {
          active?: boolean
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
      lesson_plans: {
        Row: {
          academic_year: number
          class: string
          created_at: string | null
          id: string
          subject: string
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          academic_year: number
          class: string
          created_at?: string | null
          id?: string
          subject: string
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          academic_year?: number
          class?: string
          created_at?: string | null
          id?: string
          subject?: string
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: []
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
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link_to: string | null
          message: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link_to?: string | null
          message: string
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link_to?: string | null
          message?: string
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
      students: {
        Row: {
          address: string | null
          allergy_notes: string | null
          archived: boolean
          campus_id: string | null
          class: string
          created_at: string
          departure_date: string | null
          departure_reason: string | null
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
          id: string
          info: Json | null
          insurance: string | null
          main_student_id: string | null
          malaysian_citizen: boolean | null
          name: string
          nationality: string | null
          parent1_ic: string | null
          parent1_name: string | null
          parent1_phone: string | null
          parent2_ic: string | null
          parent2_name: string | null
          parent2_phone: string | null
          previous: string | null
          relationship_type: string | null
          remarks: string | null
          sibling_discount: boolean | null
          student_ic: string | null
          updated_at: string
          user_id: string | null
          year_level: string
        }
        Insert: {
          address?: string | null
          allergy_notes?: string | null
          archived?: boolean
          campus_id?: string | null
          class: string
          created_at?: string
          departure_date?: string | null
          departure_reason?: string | null
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
          id?: string
          info?: Json | null
          insurance?: string | null
          main_student_id?: string | null
          malaysian_citizen?: boolean | null
          name: string
          nationality?: string | null
          parent1_ic?: string | null
          parent1_name?: string | null
          parent1_phone?: string | null
          parent2_ic?: string | null
          parent2_name?: string | null
          parent2_phone?: string | null
          previous?: string | null
          relationship_type?: string | null
          remarks?: string | null
          sibling_discount?: boolean | null
          student_ic?: string | null
          updated_at?: string
          user_id?: string | null
          year_level: string
        }
        Update: {
          address?: string | null
          allergy_notes?: string | null
          archived?: boolean
          campus_id?: string | null
          class?: string
          created_at?: string
          departure_date?: string | null
          departure_reason?: string | null
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
          id?: string
          info?: Json | null
          insurance?: string | null
          main_student_id?: string | null
          malaysian_citizen?: boolean | null
          name?: string
          nationality?: string | null
          parent1_ic?: string | null
          parent1_name?: string | null
          parent1_phone?: string | null
          parent2_ic?: string | null
          parent2_name?: string | null
          parent2_phone?: string | null
          previous?: string | null
          relationship_type?: string | null
          remarks?: string | null
          sibling_discount?: boolean | null
          student_ic?: string | null
          updated_at?: string
          user_id?: string | null
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
      subject_selections: {
        Row: {
          class: string
          created_at: string
          id: string
          remarks: string | null
          selected_subject_ids: number[] | null
          student_id: string
          student_name: string
          subjects: Json
          updated_at: string
          year_level: string
        }
        Insert: {
          class: string
          created_at?: string
          id?: string
          remarks?: string | null
          selected_subject_ids?: number[] | null
          student_id: string
          student_name: string
          subjects?: Json
          updated_at?: string
          year_level: string
        }
        Update: {
          class?: string
          created_at?: string
          id?: string
          remarks?: string | null
          selected_subject_ids?: number[] | null
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
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          alternative_to: number | null
          category: string | null
          class_groups: number[] | null
          code: string | null
          created_at: string
          id: number
          is_compulsory: boolean | null
          name: string
          updated_at: string
          year_levels: string[] | null
        }
        Insert: {
          alternative_to?: number | null
          category?: string | null
          class_groups?: number[] | null
          code?: string | null
          created_at?: string
          id?: number
          is_compulsory?: boolean | null
          name: string
          updated_at?: string
          year_levels?: string[] | null
        }
        Update: {
          alternative_to?: number | null
          category?: string | null
          class_groups?: number[] | null
          code?: string | null
          created_at?: string
          id?: number
          is_compulsory?: boolean | null
          name?: string
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
        ]
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
      user_profiles: {
        Row: {
          assigned_campus_id: string | null
          can_access_all_campuses: boolean
          can_manage_lesson_plans: boolean | null
          created_at: string
          departments: string[]
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          phone: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_campus_id?: string | null
          can_access_all_campuses?: boolean
          can_manage_lesson_plans?: boolean | null
          created_at?: string
          departments?: string[]
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_campus_id?: string | null
          can_access_all_campuses?: boolean
          can_manage_lesson_plans?: boolean | null
          created_at?: string
          departments?: string[]
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          role?: string
          updated_at?: string
          user_id?: string
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
      [_ in never]: never
    }
    Functions: {
      calculate_current_headcount: {
        Args: { target_campus_id?: string; target_month_start: string }
        Returns: number
      }
      can_user_access_all_campuses: { Args: never; Returns: boolean }
      can_write_grades: { Args: { p_period_id: string }; Returns: boolean }
      check_phone_exists: { Args: { phone_number: string }; Returns: Json }
      current_user_role: { Args: never; Returns: string }
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
      get_user_campus_id: { Args: never; Returns: string }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_admin_like: { Args: never; Returns: boolean }
      is_parent: { Args: never; Returns: boolean }
      is_teacher: { Args: never; Returns: boolean }
      is_teacher_assigned_to_cca: {
        Args: { p_activity_id: string }
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
      teacher_assigned_to_cca: { Args: { _cca_id: string }; Returns: boolean }
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
    Enums: {},
  },
} as const
