import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Function to extract filename from the Content-Disposition header
def extract_filename_from_headers(headers, default_name):
    content_disposition = headers.get('Content-Disposition')
    if content_disposition:
        # Try to extract filename from Content-Disposition
        filename_part = content_disposition.split('filename=')[-1]
        filename = filename_part.strip('"')
        return filename
    return default_name  # Use default if no filename is found

# Function to retrieve file name from Google Drive metadata API
def get_google_drive_filename(file_id, access_token=None):
    try:
        metadata_url = f"https://www.googleapis.com/drive/v3/files/{file_id}?fields=name"
        headers = {}
        if access_token:
            headers['Authorization'] = f"Bearer {access_token}"
        response = requests.get(metadata_url, headers=headers)
        if response.status_code == 200:
            return response.json().get('name')
        else:
            return None
    except Exception as e:
        print(f"Error fetching Google Drive filename: {e}")
        return None

# Function to convert Google Drive view link to download link and retrieve file name
def convert_google_drive_link(link):
    if 'drive.google.com' in link and '/file/d/' in link:
        file_id = link.split('/file/d/')[1].split('/')[0]  # Extract the file ID
        download_link = f'https://drive.google.com/uc?export=download&id={file_id}'
        file_name = get_google_drive_filename(file_id)  # Get the file name from Google Drive API
        if not file_name:
            file_name = f"google_drive_file_{file_id}"  # Add a fallback name
        return download_link, file_name
    return link, None  # Return the original link if it's not a Google Drive link

# Function to convert OneDrive view or shared link to a direct download link
def convert_onedrive_link(link):
    if '1drv.ms' in link or 'sharepoint.com' in link:
        try:
            response = requests.head(link, allow_redirects=True)
            expanded_url = response.url
            if 'sharepoint.com' in expanded_url:
                download_link = expanded_url.replace("?e=", "?download=1")
                return download_link
        except Exception as e:
            print(f"Error converting OneDrive link: {e}")
    return link  # Return the original link if no conversion is needed

# Function to download a file from a link, attempting to extract the filename from headers
def download_file(url, destination_folder, default_name='downloaded_file'):
    try:
        # Send a GET request to the link
        response = requests.get(url, stream=True)
        response.raise_for_status()

        # Extract filename from the headers or fallback to default_name
        filename = extract_filename_from_headers(response.headers, default_name)
        if filename == default_name:  # Add a unique ID to avoid overwrites
            ext = os.path.splitext(url)[-1] if '.' in url else ''
            filename = f"{default_name}_{hash(url)}{ext}"

        # Full path where the file will be saved
        file_path = os.path.join(destination_folder, filename)

        # Write the file content to disk
        with open(file_path, 'wb') as file:
            for chunk in response.iter_content(chunk_size=1024):
                file.write(chunk)

        print(f"Downloaded file: {file_path}")
    except requests.exceptions.RequestException as e:
        print(f"Error downloading file: {e}")


# Function to create the directory structure and download files to the OneDrive sync folder
def download_files_and_store(collected_links):
    # OneDrive sync folder path (adjust the path according to your OneDrive setup)
    one_drive_sync_folder = os.path.expanduser(r'E:\ASEB\4th Year\Project\final_naac\downloads')  # Adjust this path as needed

    # Iterate over each link and create the directory structure
    for item in collected_links:
        campus = item["campus"]
        branch = item["branch"]
        criteria = item["criteria"]
        sub_criteria = item["subCriteria"]
        link = item["link"]

        # Create the directory hierarchy inside OneDrive: campus -> branch -> criteria -> sub-criteria
        destination_folder = os.path.join(one_drive_sync_folder, campus, branch, criteria, sub_criteria)
        os.makedirs(destination_folder, exist_ok=True)  # Create the directories if they don't exist

        # Convert the Google Drive or OneDrive link to a download link and attempt to get the file name
        download_link, google_drive_filename = convert_google_drive_link(link)
        if not google_drive_filename:  # If it's not a Google Drive link, check if it's OneDrive
            download_link = convert_onedrive_link(link)

        # Use the Google Drive filename if available, otherwise use a default name
        file_name = google_drive_filename if google_drive_filename else 'downloaded_file'

        # Download the file and store it in the respective folder
        download_file(download_link, destination_folder, default_name=file_name)

# API endpoint to accept collected links and trigger the download
@app.route('/download-files', methods=['POST'])
def download_files():
    try:
        # Get the collectedLinks array from the request's JSON data
        collected_links = request.json.get('collectedLinks')

        # Start the download process
        download_files_and_store(collected_links)

        return jsonify({"message": "Files downloaded to OneDrive successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
