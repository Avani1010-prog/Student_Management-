import cv2
from config import CAMERA_INDEX

cap = cv2.VideoCapture(CAMERA_INDEX)

while True:
    ret, frame = cap.read()

    if not ret:
        print("Failed")
        break

    cv2.imshow("Camera", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()