import sys
import os
import cv2
import numpy as np
import json
import sqlite3

def get_face_crop(img, face_cascade):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
    if len(faces) > 0:
        faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
        (x, y, w, h) = faces[0]
        crop = gray[y:y+h, x:x+w]
        return cv2.resize(crop, (200, 200))
    return cv2.resize(gray, (200, 200))

def calc_hist(img):
    hist = cv2.calcHist([img], [0], None, [256], [0, 256])
    cv2.normalize(hist, hist, 0, 1, cv2.NORM_MINMAX)
    return hist

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No image path provided"}))
        return

    img_path = sys.argv[1]
    if not os.path.exists(img_path):
        print(json.dumps({"success": False, "error": "Image file not found"}))
        return

    data_dir = "data"
    if not os.path.exists(data_dir) or not os.listdir(data_dir):
        print(json.dumps({"success": False, "error": "No registered student face data found."}))
        return

    model_path = "face_model.yml"
    label_path = "labels.npy"
    if not os.path.exists(model_path) or not os.path.exists(label_path):
        os.system("python train_model.py")

    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    input_img = cv2.imread(img_path)
    if input_img is None:
        print(json.dumps({"success": False, "error": "Could not read input image"}))
        return

    input_face = get_face_crop(input_img, face_cascade)
    input_hist = calc_hist(input_face)

    # 1. LBPH Model Prediction
    lbph_match = None
    lbph_conf = 999
    if os.path.exists(model_path) and os.path.exists(label_path):
        try:
            model = cv2.face.LBPHFaceRecognizer_create()
            model.read(model_path)
            label_map = np.load(label_path, allow_pickle=True).item()
            label, conf = model.predict(input_face)
            lbph_match = label_map.get(label, "Unknown")
            lbph_conf = conf
        except Exception as e:
            pass

    # 2. Histogram Correlation Comparison against all saved student face images
    best_hist_match = None
    best_hist_score = -1.0

    for person_folder in os.listdir(data_dir):
        person_path = os.path.join(data_dir, person_folder)
        if not os.path.isdir(person_path):
            continue

        for img_file in os.listdir(person_path):
            img_full = os.path.join(person_path, img_file)
            saved_img = cv2.imread(img_full)
            if saved_img is None:
                continue

            saved_face = get_face_crop(saved_img, face_cascade)
            saved_hist = calc_hist(saved_face)

            score = cv2.compareHist(input_hist, saved_hist, cv2.HISTCMP_CORREL)
            if score > best_hist_score:
                best_hist_score = score
                best_hist_match = person_folder

    chosen_match = None
    confidence_score = 0.0

    if lbph_match and lbph_match != "Unknown" and lbph_conf < 135:
        chosen_match = lbph_match
        confidence_score = float(lbph_conf)
    elif best_hist_match and best_hist_score > 0.35:
        chosen_match = best_hist_match
        confidence_score = float(best_hist_score)

    if chosen_match:
        db_path = os.path.join("database", "student_management.db")
        roll_number = ""
        student_id = None
        real_name = chosen_match

        if os.path.exists(db_path):
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            cur.execute("SELECT student_id, university_roll_number, name FROM students WHERE name LIKE ? OR university_roll_number = ?", (f"%{chosen_match}%", chosen_match))
            row = cur.fetchone()
            if row:
                student_id, roll_number, real_name = row
            conn.close()

        print(json.dumps({
            "success": True,
            "name": real_name,
            "roll_number": roll_number,
            "student_id": student_id,
            "confidence": confidence_score
        }))
    else:
        print(json.dumps({"success": False, "error": "Face not recognized in system"}))

if __name__ == "__main__":
    main()
