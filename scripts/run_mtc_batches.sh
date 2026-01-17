#!/bin/bash
# Process MTC routes in batches of 10
# Usage: bash scripts/run_mtc_batches.sh

set -e

# All routes from MTC website
ALL_ROUTES="101,101CT,101X,102,102A,102C,102CT,102E,102K,102M,102P,102S,102X,104,104A,104C,104CX,104F,104G,104K,104M,104P,104T,105,105A,109,109A,109C,109CT,109T,109X,10A,10E,11,111,111ET,113,113A,114,114A,114C,114CCT,114D,114E,114ET,114G,114P,114S,118,118ET,118G,118N,118P,118T,119,119G,11G,11M,120,120A,120CT,120E,120F,120G,120K,120KET,121,121A,121C,121CT,121D,121G,121M,121MET,129C,12B,12G,12M,12X,13,142,142B,142P,147A,147B,147C,147V,14A,15,150,153,153A,153P,153T,154,154B,154E,154P,155A,157,157E,159,159E,159K,15BET,15F,15G,164,166,166K,16J,16K,170A,170C,170CE,170K,170T,170TX,17D,17E,17K,188A,188C,188ET,188K,18A,18ACT,18B,18D,18E,18H,18K,18M,18N,18P,18R,18RX,18S,18X,19,19A,19B,19BET,19C,19D,19T,1C,1D,20,202,202A,202X,206,20A,20D,20P,21,21C,21EET,21G,21L,22,221,23C,23V,242,24A,24AX,25,26,266,26B,26G,26K,26M,26R,27B,27D,28A,28B,297,29A,29AET,29AEX,29B,29C,29CET,29CEX,29D,29E,29ET,29NET,2A,2B,3,31A,31B,31G,31M,31P,32A,32B,33B,33C,33L,34,35,35C,36K,36M,36V,37,37B,37CT,37E,37ECT,37G,38A,38C,38D,38G,38H,4,40A,40H,40L,40N,41D,42,42B,42C,42D,42M,44,44C,44CT,45A,45ACT,45B,45BET,46,46ET,46G,47,47A,47C,47CX,47DCT,47T,48A,48AET,48B,48BX,48C,48K,48P,49,49A,49F,49K,49X,4M,50,500,500A,500D,500E,500ET,500P,500R,500W,505,505K,50ET,50M,51,512,514,514ET,515,515A,515B,515CT,515K,515M,515T,517K,519T,51A,51AX,51B,51C,51D,51J,51M,51T,51X,52,523,523A,525,52B,52C,52G,52H,52K,53,53E,53G,53P,54,547,547A,549,54B,54C,54E,54G,54K,54L,54P,54S,54T,54V,54VCT,552K,553K,553W,554B,555G,555M,555N,555P,555S,556,557,557AE,557C,557M,558A,558B,558C,558L,558P,55A,55B,55C,55D,55DET,55ET,55G,55H,55K,55M,55N,55P,55V,55X,565,566,566B,568B,56A,56ACT,56C,56D,56DET,56F,56J,56K,56P,57,570,570ET,570P,572,572A,572K,578,578A,578ET,578M,578P,579A,579C,579K,57A,57B,57CCT,57D,57E,57F,57G,57H,57J,57M,57X,580,580A,580M,583,583A,583C,583D,583K,588,58V,59,591,591C,592,592V,593CT,595,597,597A,597C,597CET,5B,5C,5E,5G,5S,6,60,60A,60D,60E,60G,60H,61A,61C,61E,61K,61R,62,62A,62B,62CT,62M,63,64C,64D,64K,64KET,64M,65A,65B,65CCT,65D,65E,65G,65H,65K,66,66A,66K,66M,66P,66PX,6D,6DET,70,70A,70ACT,70C,70CCT,70E,70F,70G,70H,70J,70K,70LCT,70M,70N,70T,70V,71D,71E,71H,71V,72,72M,73,73A,73C,73CT,76,76B,77,77A,77B,77CT,77E,77FCT,77K,77M,77P,77T,77V,77VET,78,79A,79V,7E,7H,7K,7M,7MET,88C,88CET,88D,88K,88KET,88L,88M,88R,89,89A,89T,89TCT,8ACT,8B,91,91A,91R,91V,95,95X,95XCT,96,99,99A,99C,99X,9M,9MET,A1,A1ET,A45B,A47,A51,B70CT,C33,C56C,C56CET,C64,D51ET,D70,D70CT,D70X,E18,E51,F70,G18,J51,J66,M1,M18C,M18G,M19B,M1A,M27,M51,M51D,M51DCT,M51R,M51V,M51VCT,M52ET,M60,M70,M88,M88ET,M88T,MAA1,MAA2,N45B,S1,S100,S11,S12,S13,S14M,S15,S165,S166,S167,S169,S17,S18D,S18K,S19,S2,S20,S21C,S22,S23,S24,S25,S25A,S26,S27,S28,S30,S30CT,S30K,S31,S35,S36,S3X,S4,S40,S41,S42,S43,S44,S45,S46,S47,S47M,S48,S49,S5,S50,S51,S52,S53,S55,S55W,S56,S58,S59,S6,S60,S62,S63,S64,S66,S67,S69,S70K,S73,S74,S75,S79,S80,S81,S82,S83,S84,S86,S88A,S90,S94,S95,S97,S98,SC1,SM1CT,T23C,T29,T29C,V51,V51CT"

# Split routes into array
IFS=',' read -ra ROUTES <<< "$ALL_ROUTES"
TOTAL_ROUTES=${#ROUTES[@]}

# Calculate number of batches (10 routes per batch)
BATCH_SIZE=10
NUM_BATCHES=$(( (TOTAL_ROUTES + BATCH_SIZE - 1) / BATCH_SIZE ))

echo "Total routes: $TOTAL_ROUTES"
echo "Batches: $NUM_BATCHES (size: $BATCH_SIZE)"
echo ""

# Activate virtual environment
source .venv/bin/activate

# Process each batch (starting from batch 13)
START_BATCH=${1:-0}  # Allow passing starting batch as argument (0-indexed)
for ((batch=START_BATCH; batch<NUM_BATCHES; batch++)); do
  START_IDX=$((batch * BATCH_SIZE))
  END_IDX=$((START_IDX + BATCH_SIZE))
  if [ $END_IDX -gt $TOTAL_ROUTES ]; then
    END_IDX=$TOTAL_ROUTES
  fi
  
  # Extract routes for this batch
  BATCH_ROUTES=""
  for ((i=START_IDX; i<END_IDX; i++)); do
    if [ -n "$BATCH_ROUTES" ]; then
      BATCH_ROUTES="$BATCH_ROUTES,${ROUTES[$i]}"
    else
      BATCH_ROUTES="${ROUTES[$i]}"
    fi
  done
  
  BATCH_NUM=$((batch + 1))
  OUTPUT_FILE="data/mtc_batch${BATCH_NUM}_$(date +%Y%m%d_%H%M%S).json"
  
  echo "============================================"
  echo "Batch $BATCH_NUM of $NUM_BATCHES"
  echo "Routes: $BATCH_ROUTES"
  echo "Output: $OUTPUT_FILE"
  echo "============================================"
  echo ""
  
  # Run scraper for this batch with increased delay
  python scripts/run_mtc_http_parallel.py \
    --routes "$BATCH_ROUTES" \
    --workers 4 \
    --delay 1.2 \
    --insecure \
    --output "$OUTPUT_FILE"
  
  echo ""
  echo "Batch $BATCH_NUM completed successfully!"
  echo ""
  
  # Small delay between batches to be nice to the server
  if [ $BATCH_NUM -lt $NUM_BATCHES ]; then
    echo "Waiting 5 seconds before next batch..."
    sleep 5
  fi
done

echo ""
echo "============================================"
echo "ALL BATCHES COMPLETED!"
echo "============================================"
echo "Merging results..."

# Merge all batch files
python -c "
import json
from pathlib import Path
import sys

batch_files = sorted(Path('data').glob('mtc_batch*_*.json'))
if not batch_files:
    print('No batch files found!')
    sys.exit(1)

all_timings = []
for f in batch_files:
    print(f'Reading {f.name}...')
    with open(f, 'r', encoding='utf-8') as fp:
        timings = json.load(fp)
        all_timings.extend(timings)
        print(f'  {len(timings)} timings')

output = Path('data/mtc_all_routes_complete_$(date +%Y%m%d_%H%M%S).json')
with open(output, 'w', encoding='utf-8') as fp:
    json.dump(all_timings, fp, indent=2, ensure_ascii=False)

print(f'\\nTotal timings: {len(all_timings)}')
print(f'Saved to: {output}')
"

echo "Done!"
