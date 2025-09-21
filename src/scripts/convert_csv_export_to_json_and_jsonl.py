import csv
import json

CSV_FILE_PATH = '../assets/downloads/OpenEnzymeDatabase-1.0.0.csv'

def main():
    # Load the CSV file
    with open(CSV_FILE_PATH, 'r', encoding='utf-8-sig') as file:
        reader = csv.DictReader(file, quotechar='"', quoting=csv.QUOTE_ALL)
        example_data = [row for row in reader]
    print(example_data[0])
    
    # Convert to JSON and save as .json
    with open(CSV_FILE_PATH.replace('.csv', '.json'), 'w') as json_file:
        json.dump(example_data, json_file, indent=4)

    # Convert to JSONL and save as .jsonl
    with open(CSV_FILE_PATH.replace('.csv', '.jsonl'), 'w') as jsonl_file:
        for entry in example_data:
            jsonl_file.write(json.dumps(entry) + '\n')

if __name__ == "__main__":
    main()