import geopandas as gpd

datageo = gpd.read_file("D:\\envirometrics\\backend2\\static\\D733D\\oridata.shp")
print(datageo.head())
