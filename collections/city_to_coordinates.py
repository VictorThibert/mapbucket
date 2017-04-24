# script to convert city names into latitude and longitude

import sys
import urllib.request
import urllib.parse
import json
import csv


def main():

	base_url = 'http://nominatim.openstreetmap.org/search?format=json&q='
	

	locations = []
	f = open(sys.argv[1], 'r')
	reader = csv.reader(f)
	for row in reader:
		locations.append([row[0], row[1], row[2], row[3]]) # rank / city / country / teu
	f.close()
	del locations[0]

	for location in locations:
		city = urllib.parse.quote(location[1])
		country = urllib.parse.quote(location[2])

		try:
			with urllib.request.urlopen(base_url+city+'+'+country) as url:
				data = json.loads(url.read().decode())
				print('--------------------------', base_url+city+'+'+country)
				try:
					location.append(data[0]['lat'])
					location.append(data[0]['lon'])
				except IndexError as e:
					print('missing at: ', location)
		except UnicodeEncodeError as f:
			print('unicode error at: ', location)


	print(locations)

	with open (sys.argv[2], 'w') as f:
		wtr = csv.writer(f)
		wtr.writerow(['rank','city','country','teu','lat','lon'])

		for location in locations:
			wtr.writerow(location)


if __name__ == '__main__':
	main()