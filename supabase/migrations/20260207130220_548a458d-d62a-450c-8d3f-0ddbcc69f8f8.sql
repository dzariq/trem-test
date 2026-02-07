-- Update Art Club with more complete data
UPDATE cca_activities 
SET 
  public_description = 'Explore your creativity through various art forms including painting, drawing, and crafts. Students will develop artistic skills while expressing themselves through visual arts.',
  location = 'Art Room',
  meeting_day = 'Wednesday',
  meeting_time = '3:30 PM - 5:00 PM',
  coordinator_name = 'Teacher Adam',
  coordinator_email = 'adam@collinz.edu.my'
WHERE id = '7908db09-dd1a-4122-bde5-d01f945eb034';

-- Update Sports United with complete data
UPDATE cca_activities 
SET 
  public_description = 'A multi-sports club focusing on teamwork, fitness, and sportsmanship. Activities include basketball, badminton, and football.',
  location = 'Main Hall',
  meeting_day = 'Friday',
  meeting_time = '3:00 PM - 4:30 PM',
  coordinator_name = 'Coach Sarah',
  coordinator_email = 'sarah@collinz.edu.my'
WHERE id = 'ce65b272-9d82-434c-bda0-c71e7cc466e7';

-- Add Teacher Adam as primary PIC for Sports United
INSERT INTO cca_activity_teachers (activity_id, teacher_user_id, is_primary, role)
VALUES ('ce65b272-9d82-434c-bda0-c71e7cc466e7', '47be17f1-ba0f-4a98-b302-50f8dc4b66ec', true, 'PIC')
ON CONFLICT DO NOTHING;

-- Add Test 5 as supporting teacher for Sports United
INSERT INTO cca_activity_teachers (activity_id, teacher_user_id, is_primary, role)
VALUES ('ce65b272-9d82-434c-bda0-c71e7cc466e7', '47ef8e6d-47d1-4298-bd99-fc81d7805f65', false, 'PIC')
ON CONFLICT DO NOTHING;