from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from flask_cors import CORS
import os
import uuid

import geopandas as gpd
import fiona

from shapely.geometry import Point, Polygon, mapping
#from osgeo import ogr
#from osgeo import osr
from zipfile import ZipFile


app = Flask(__name__)
UPLOAD_FOLDER = './static'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER 
CORS(app)



@app.route('/')
def hello():
    return 'Experimental!'

@app.route("/upload", methods = ['GET', 'POST'])
def upload():
    shp = ''
    hostname = request.headers.get('Host')
    if request.method == 'POST':
        # receive the shape file
        f = request.files['shapeFile']
        
        # make new folder with random name
        lowercase_str = uuid.uuid4().hex  
        uppercase_str = lowercase_str.upper()
        new_folder = uppercase_str[:5]
        os.mkdir(app.config['UPLOAD_FOLDER']+"/"+new_folder)
        f.save(os.path.join(app.config['UPLOAD_FOLDER']+"/"+new_folder,secure_filename(f.filename)))
        fname = os.getcwd()+"\static\\" + new_folder + "\\" + f.filename

        # unzip file
        with ZipFile(fname, 'r') as zip:
            zip.extractall(os.getcwd()+"\static\\" + new_folder)

        # find shp file
        scandir = os.listdir(os.getcwd()+"\static\\" + new_folder)
        for f in scandir:
            if f[len(f)-3:len(f)]=='shp':
                shp = os.getcwd()+"\static\\" + new_folder + "\\" + f
                break

        # set KML driver
        fiona.supported_drivers['KML'] = 'rw'
        # read data from shape file and return the reading
        dg = gpd.read_file(shp)
        # change to well known type (wkt) format
        datageo = dg.to_crs(4326)
        print("type : ",datageo.crs,"; Row Count :",datageo.shape[0])
        # save as GEOJSON and KML format
        dg.to_file(os.getcwd()+"\\static\\" + new_folder + "\\data.geojson", driver="GeoJSON")
        dg.to_file(os.getcwd()+"\\static\\" + new_folder + "\\data.kml", driver="KML")

        colwval = {}
        for col in datageo.columns:
            if col!='geometry':
                colwval[col]=datageo[col].tolist()
            else:
                colwval['geom_type']=datageo[col].geom_type.tolist()
        colwval['data']=[]
        colwval['folder'] = []
        for i in range(len(colwval['geom_type'])):
            if colwval['geom_type'][i]=='Polygon':
                nc = []
                for j in range(len(datageo['geometry'][i].exterior.coords.xy[0])):
                    # latitude, longitude
                    nc.append( [ datageo['geometry'][i].exterior.coords.xy[1][j], datageo['geometry'][i].exterior.coords.xy[0][j] ] )
                colwval['data']=nc
            if colwval['geom_type'][i]=='Point':
                # latitude, longitude
                colwval['data'].append( [ datageo['geometry'][i].x, datageo['geometry'][i].y ] )
        colwval['folder'].append( ["http://"+hostname+"/static/"+new_folder+"/data.kml", "http://"+hostname+"/static/"+new_folder+"/data.geojson"] )
        return jsonify(colwval), 200
        

@app.route("/download", methods = ['GETS', 'POST'])
def download():
    pass


      