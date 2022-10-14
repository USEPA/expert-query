import argparse
import json
import os
import requests
from string import Template

data_file = "assessments-by-catchment.json"
url = (
    "https://gispub.epa.gov/arcgis/rest/services"
    + "/OW/ATTAINS_Assessment/MapServer/6/query"
)

parser = argparse.ArgumentParser()
parser.add_argument(
    "file",
    metavar="file.json",
    type=str,
    help="a JSON file of HUC12 arrays for which data should be fetched",
)
args = parser.parse_args()
template_str = (
    "where=huc12+%3D+%27${huc12}%27&text=&objectIds=&time="
    "&timeRelation=esriTimeRelationOverlaps&geometry="
    "&geometryType=esriGeometryEnvelope&inSR="
    "&spatialRel=esriSpatialRelIntersects&distance="
    "&units=esriSRUnit_Foot&relationParam=&outFields=*"
    "&returnGeometry=false&returnTrueCurves=false"
    "&maxAllowableOffset=&geometryPrecision=&outSR=&havingClause="
    "&returnIdsOnly=false&returnCountOnly=false&orderByFields="
    "&groupByFieldsForStatistics=&outStatistics=&returnZ=false"
    "&returnM=false&gdbVersion=&historicMoment="
    "&returnDistinctValues=false&resultOffset=&resultRecordCount="
    "&returnExtentOnly=false&sqlFormat=none&datumTransformation="
    "&parameterValues=&rangeValues=&quantizationParameters="
    "&featureEncoding=esriDefault&f=pjson"
)
template = Template(template_str)

features = []
if os.path.exists(args.file):
    states = None
    with open(args.file, "r") as infile:
        try:
            states = json.load(infile)
        except ValueError:
            pass
    if states and type(states) is dict:
        for state in states.values():
            for huc12 in state:
                print(huc12)
                query = template.substitute(huc12=huc12)
                resp = requests.get(f"{url}?{query}")
                resp_json = resp.json()
                if "features" in resp_json:
                    for feature in resp_json["features"]:
                        if "attributes" in feature:
                            features.append(feature["attributes"])

if os.path.exists(data_file):
    with open(data_file, "w") as outfile:
        json.dump(features, outfile)
