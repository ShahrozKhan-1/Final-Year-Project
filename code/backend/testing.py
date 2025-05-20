from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound
import re

def get_video_id(url):
    """Extract YouTube video ID from various URL formats"""
    patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
        r'youtu\.be\/([0-9A-Za-z_-]{11})',
        r'\/live\/([0-9A-Za-z_-]{11})'
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def get_transcript(url, language='en'):
    """Get transcript for a YouTube video"""
    try:
        video_id = get_video_id(url)
        if not video_id:
            return "Invalid YouTube URL"
        
        transcript = YouTubeTranscriptApi.get_transcript(
            video_id,
            languages=[language]
        )
        
        # Format transcript with timestamps
        formatted = []
        for entry in transcript:
            mins = int(entry['start'] // 60)
            secs = int(entry['start'] % 60)
            formatted.append(f"[{mins:02d}:{secs:02d}] {entry['text']}")
        
        return '\n'.join(formatted)
    
    except TranscriptsDisabled:
        return "Transcript is disabled for this video"
    except NoTranscriptFound:
        return "No transcript available for this video"
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    # Example usage
    url = input("Enter YouTube URL: ")
    transcript = get_transcript(url)
    print("\nVideo Transcript:")
    print(transcript)