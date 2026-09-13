import cv2
import os
import time
from config import CAMERA_INDEX

print("Starting Camera Face Capture... Press 'q' or 'ESC' or Close Window to exit.")

cap = cv2.VideoCapture(CAMERA_INDEX)
if not cap.isOpened():
    print("Error: Could not open webcam.")
    exit(1)

# Ask student name
name = input("Enter student name: ").strip()
if not name:
    name = "student_" + str(int(time.time()))

# Create folder for student dataset
dataset_path = "data"
student_path = os.path.join(dataset_path, name)

if not os.path.exists(student_path):
    os.makedirs(student_path)

# Load face detector
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

window_name = "Capturing Faces - CAMP ERP"
cv2.namedWindow(window_name, cv2.WINDOW_AUTOSIZE)

count = 0

try:
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame from camera.")
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)

        for (x, y, w, h) in faces:
            count += 1

            face = frame[y:y+h, x:x+w]
            file_name = os.path.join(student_path, f"{count}.jpg")
            cv2.imwrite(file_name, face)

            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            cv2.putText(frame, f"Captured: {count}/50", (x, y-10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

        cv2.putText(frame, "Press 'q' or 'ESC' to Stop", (20, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)

        cv2.imshow(window_name, frame)

        # 1. Stop after 50 images OR press 'q'/'Q'/ESC
        key = cv2.waitKey(1) & 0xFF
        if key in [ord('q'), ord('Q'), 27] or count >= 50:
            break

        # 2. Check if user clicked window 'X' close button
        if cv2.getWindowProperty(window_name, cv2.WND_PROP_VISIBLE) < 1:
            break

finally:
    print("Releasing camera hardware...")
    cap.release()
    cv2.destroyAllWindows()
    for _ in range(5):
        cv2.waitKey(1)
    print(f"Camera stopped. {count} images saved for {name} in {student_path}")