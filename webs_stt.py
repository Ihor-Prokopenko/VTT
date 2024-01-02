import asyncio
import json
import websockets
import os
import base64

from pathlib import Path
import speech_recognition as sr

from convert_audio import convert_to_pcm_wav

credentials_path = "/home/ihor/Projects/weatherreminder-393914-9459c847bccc.json"
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = credentials_path


async def handle_audio(websocket):
    audio_data = await websocket.recv()

    audio_file_path = Path("./recorded_audio.wav")
    with open(audio_file_path, 'wb') as audio_file:
        audio_file.write(audio_data)

    result: str = recognize_audio_from_file(audio_file_path)
    result_data: dict = {'text': result, 'audio': base64.b64encode(audio_data).decode('utf-8')}

    await websocket.send(json.dumps(result_data))


def recognize_audio_from_file(audio_file_path):
    recognizer = sr.Recognizer()

    audio_file_path_str = str(audio_file_path)
    if os.path.exists(audio_file_path):
        convert_to_pcm_wav(audio_file_path_str, audio_file_path_str)

    with sr.AudioFile(audio_file_path_str) as source:
        audio_data = recognizer.record(source)
        print(audio_data)

    try:
        language = "en-US"
        # language = "uk-UA"
        text: str = recognizer.recognize_google_cloud(audio_data, language=language)
        return text
    except sr.UnknownValueError:
        return "Recognition failed"
    except sr.RequestError as e:
        return f"Request error: {e}"


start_server = websockets.serve(handle_audio, "localhost", 8765)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
