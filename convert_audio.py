from pydub import AudioSegment


def convert_to_pcm_wav(input_path, output_path):
    audio = AudioSegment.from_file(input_path)

    audio = audio.set_frame_rate(44100).set_sample_width(2).set_channels(1)

    audio.export(output_path, format="wav")
