import cv2
import numpy as np
import time
import os

from attendance_system import mark_attendance
from config import CAMERA_INDEX


marked_students = set()
auto_close_time = None

# Maximum camera scanning session timeout
MAX_SCAN_TIMEOUT_SECONDS = 30
session_start_time = time.time()

print("Starting Camera Face Recognition...")
print("Press 'q' or 'ESC' or Close Window to exit.")

cap = cv2.VideoCapture(CAMERA_INDEX)

if not cap.isOpened():
    print("Error: Could not open webcam.")
    exit(1)


# Load trained model if exists, or auto-train
model_path = "face_model.yml"
label_path = "labels.npy"

if not os.path.exists(model_path) or not os.path.exists(label_path):
    print("Trained face model not found.")
    print("Training model from saved student face images now...")

    os.system("python train_model.py")


if not os.path.exists(model_path) or not os.path.exists(label_path):
    print("Warning: No student face images found in data folder.")
    model = None
    label_map = {}

else:
    model = cv2.face.LBPHFaceRecognizer_create()
    model.read(model_path)

    label_map = np.load(
        label_path,
        allow_pickle=True
    ).item()


# Load face detector
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades +
    "haarcascade_frontalface_default.xml"
)

window_name = "Face Recognition - CAMP ERP"

cv2.namedWindow(window_name, cv2.WINDOW_AUTOSIZE)


try:

    # Camera continuously chalega
    while True:

        ret, frame = cap.read()

        if not ret:
            print("Failed to grab frame from camera.")
            break

        current_time = time.time()

        elapsed_session_time = (
            current_time - session_start_time
        )

        gray = cv2.cvtColor(
            frame,
            cv2.COLOR_BGR2GRAY
        )

        faces = face_cascade.detectMultiScale(
            gray,
            1.3,
            5
        )


        # Detect all faces
        for (x, y, w, h) in faces:

            face = gray[y:y+h, x:x+w]

            face = cv2.resize(
                face,
                (200, 200)
            )

            display_text = "Unknown Face"
            color = (0, 0, 255)  # Red


            # Check trained model
            if model is not None and len(label_map) > 0:

                label, confidence = model.predict(face)

                print("PREDICTED LABEL:", label)
                print("CONFIDENCE:", confidence)
                print("LABEL MAP:", label_map)


                # Confidence kam = better match
                if confidence < 80:

                    name = label_map.get(
                        label,
                        "Unknown"
                    )


                    if name != "Unknown":

                        display_text = (
                            f"{name} ({confidence:.1f})"
                        )

                        color = (0, 255, 0)  # Green


                        # Attendance sirf ek baar mark hogi
                        if name not in marked_students:

                            mark_attendance(name)

                            marked_students.add(name)

                            print(
                                f"Attendance marked for {name}"
                            )


                            # 3 seconds baad camera close
                            if not auto_close_time:

                                auto_close_time = (
                                    current_time + 3
                                )


            # Draw rectangle around face
            cv2.rectangle(
                frame,
                (x, y),
                (x + w, y + h),
                color,
                2
            )

            cv2.putText(
                frame,
                display_text,
                (x, y - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                color,
                2
            )


        # --------------------------------
        # 1. POST RECOGNITION COUNTDOWN
        # --------------------------------

        if auto_close_time:

            remaining = max(
                0,
                int(auto_close_time - current_time)
            )

            cv2.putText(
                frame,
                f"Attendance Marked! Closing in {remaining}s...",
                (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 255, 255),
                2
            )


            if current_time >= auto_close_time:

                print(
                    "Auto-closing camera after successful attendance mark."
                )

                break


        # --------------------------------
        # 2. OVERALL SESSION TIMEOUT
        # --------------------------------

        else:

            remaining_session = max(
                0,
                int(
                    MAX_SCAN_TIMEOUT_SECONDS -
                    elapsed_session_time
                )
            )

            cv2.putText(
                frame,
                f"Scanning... Auto Timeout in {remaining_session}s | Press 'q' / ESC to exit",
                (20, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                (255, 255, 255),
                1
            )


            if elapsed_session_time >= MAX_SCAN_TIMEOUT_SECONDS:

                print(
                    f"Camera session timed out after "
                    f"{MAX_SCAN_TIMEOUT_SECONDS} seconds "
                    f"without recognition."
                )

                break


        # Show camera window
        cv2.imshow(
            window_name,
            frame
        )


        # --------------------------------
        # 3. MANUAL EXIT KEYS
        # --------------------------------

        key = cv2.waitKey(1) & 0xFF

        if key in [ord("q"), ord("Q"), 27]:

            print("User requested camera stop.")

            break


        # --------------------------------
        # 4. WINDOW CLOSE BUTTON
        # --------------------------------

        if cv2.getWindowProperty(
            window_name,
            cv2.WND_PROP_VISIBLE
        ) < 1:

            print("Camera window closed by user.")

            break


finally:

    print("Releasing camera hardware...")

    cap.release()

    cv2.destroyAllWindows()

    for _ in range(5):
        cv2.waitKey(1)

    print("Camera stopped and closed successfully.")