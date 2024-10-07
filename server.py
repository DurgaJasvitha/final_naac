import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Function to extract filename from the Content-Disposition header
def extract_filename_from_headers(headers):
    content_disposition = headers.get('Content-Disposition')
    if content_disposition:
        # Try to extract filename from Content-Disposition
        filename_part = content_disposition.split('filename=')[-1]
        filename = filename_part.strip('"')
        return filename
    return None

# Function to convert Google Drive view link to download link
def convert_google_drive_link(link):
    if 'drive.google.com' in link and '/file/d/' in link:
        file_id = link.split('/file/d/')[1].split('/')[0]  # Extract the file ID
        download_link = f'https://drive.google.com/uc?export=download&id={file_id}'
        return download_link
    return link  # Return the original link if it's not a Google Drive link

# Function to download a file from a link, attempting to extract the filename from headers
def download_file(url, destination_folder):
    try:
        # Send a GET request to the link
        response = requests.get(url, stream=True)
        response.raise_for_status()

        # Try to extract the filename from the headers
        filename = extract_filename_from_headers(response.headers)

        # If no filename is found in the headers, use a default one
        if not filename:
            filename = 'downloaded_file'

        # Full path where the file will be saved
        file_path = os.path.join(destination_folder, filename)

        # Write the file content to the disk
        with open(file_path, 'wb') as file:
            for chunk in response.iter_content(chunk_size=1024):
                file.write(chunk)

        print(f"Downloaded file: {file_path}")
    except requests.exceptions.RequestException as e:
        print(f"Error downloading file: {e}")

# Function to create the directory structure and download files
def download_files_and_store(collected_links):
    base_directory = "downloads"  # Base directory to store all the downloads

    # Iterate over each link and create the directory structure
    for item in collected_links:
        campus = item["campus"]
        branch = item["branch"]
        criteria = item["criteria"]
        sub_criteria = item["subCriteria"]
        link = item["link"]

        # Create the directory hierarchy: campus -> branch -> criteria -> sub-criteria
        destination_folder = os.path.join(base_directory, campus, branch, criteria, sub_criteria)
        os.makedirs(destination_folder, exist_ok=True)  # Create the directories if they don't exist

        # Convert the Google Drive view link to a download link
        download_link = convert_google_drive_link(link)

        # Download the file and store it in the respective folder
        download_file(download_link, destination_folder)

# API endpoint to accept collected links and trigger the download
@app.route('/download-files', methods=['POST'])
def download_files():
    try:
        # Get the collectedLinks array from the request's JSON data
        collected_links = request.json.get('collectedLinks')

        # Start the download process
        download_files_and_store(collected_links)

        return jsonify({"message": "Files downloaded successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
