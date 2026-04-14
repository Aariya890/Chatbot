from flask import Flask, request, jsonify, render_template

try:
    from hf import generate_response
except ImportError:
    def generate_response(prompt, temperature=0.5, max_tokens=700):
        return "Error: hf.py not found or generate_response() not implemented."

app = Flask(__name__)

SYSTEM_PROMPT = """You are a professional AI teaching assistant.
Explain clearly with headings, bullet points, and examples.
"""


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/chat", methods=["POST"])
def chat():
    try:

        data = request.get_json()

        if not data or "message" not in data:
            return jsonify({"reply": "Invalid request. Please send a message."}), 400

        user_message = data.get("message", "").strip()

        if not user_message:
            return jsonify({"reply": "Please enter a valid message."}), 400


        prompt = f"{SYSTEM_PROMPT}\nUser: {user_message}\nAssistant:"


        response = generate_response(
            prompt,
            temperature=0.5,
            max_tokens=700
        )

        return jsonify({"reply": response})

    except Exception as e:
        return jsonify({"error": str(e)}), 500



if __name__ == "__main__":
    app.run(debug=True)