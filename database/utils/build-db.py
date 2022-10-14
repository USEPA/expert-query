import argparse
import json
import os

db_file = "assessments_by_catchment.sql"

parser = argparse.ArgumentParser()
parser.add_argument(
    "files",
    metavar="file.json",
    type=str,
    nargs="+",
    help="a JSON file to parse into the database",
)
args = parser.parse_args()

data = []
for file in args.files:
    features = None
    if os.path.exists(file):
        with open(file, "r") as infile:
            try:
                features = json.load(infile)
            except ValueError:
                pass
    if features and type(features) is list:
        for feature in features:
            if type(feature) is dict:
                data.append(list(feature.values()))

if os.path.exists(db_file):
    with open(db_file, "a") as outfile:
        rows = ""
        for i, datum in enumerate(data):
            row = "("
            for j, attr in enumerate(datum):
                if type(attr) is str:
                    row += f"'{attr}'"
                elif attr is None:
                    row += "NULL"
                else:
                    row += str(attr)
                if j < len(datum) - 1:
                    row += ", "
            row += ")"
            if i < len(data) - 1:
                row += ",\n"
            else:
                row += ";\n"
            rows += row
        outfile.write(rows)
