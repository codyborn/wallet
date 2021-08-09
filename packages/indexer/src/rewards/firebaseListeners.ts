import { sleep } from '@celo/base'
import * as admin from 'firebase-admin'
import { FIREBASE_DB, FIREBASE_PROJECT_ID, getFirebaseAdminCreds } from '../config'
import { database } from '../database/db'
import { createAndDeployMerkleDistributor } from './createMerkleDistributor'
import { distributeRewards } from './distributeRewards'
import { updatePartialBalances } from './updatePartialBalances'

export async function initializeFirebase() {
  admin.initializeApp({
    credential: getFirebaseAdminCreds(admin),
    databaseURL: FIREBASE_DB,
    projectId: FIREBASE_PROJECT_ID,
  })
  await initializeFirebaseDb()
}

enum DistributionStatus {
  Pending = 'Pending',
  UpdatingBalances = 'UpdatingBalances',
  CalculatingRewards = 'CalculatingRewards',
  DistributionCreated = 'DistributionCreated',
  StartDistribution = 'StartDistribution',
  Distributing = 'Distributing',
  Done = 'Done',
}

async function updateDistributionStatus(key: string, status: DistributionStatus) {
  return admin.database().ref(`/rewardDistributions/${key}/status`).set(status)
}

async function handleNewDistribution(key: string, distributionParams: any) {
  const { status, skipDistribution, fromBlock, toBlock } = distributionParams
  if (status !== DistributionStatus.Pending) {
    console.debug(`Skipping distribution with status ${status}`)
    return
  }
  if ((fromBlock !== 0 && !fromBlock) || !toBlock) {
    console.error('fromBlock and toBlock are mandatory fields to create a rewards distribution')
    return
  }
  const latestUpdatedBlock = (await database('partial_balances').max('blockUpdated'))[0].max ?? 0
  if (latestUpdatedBlock > fromBlock) {
    // Note: In an ideal world we'd never need to re-run a distribution, but if it's ever
    // necessary we could add a flag to skip this step and validation
    console.error(
      `fromBlock ${fromBlock} should be bigger than the fromBlock from the previous distribution ${latestUpdatedBlock}.`
    )
    return
  }

  await updateDistributionStatus(key, DistributionStatus.UpdatingBalances)
  await updatePartialBalances(latestUpdatedBlock, fromBlock)
  await updateDistributionStatus(
    key,
    skipDistribution ? DistributionStatus.Done : DistributionStatus.CalculatingRewards
  )
  if (!skipDistribution) {
    const distributionInfo = await createAndDeployMerkleDistributor(fromBlock, toBlock)
    console.log('Distribution info ready', distributionInfo)
    await admin
      .database()
      .ref(`/rewardDistributions/${key}`)
      .update({
        status: DistributionStatus.DistributionCreated,
        ...distributionInfo,
      })
  }
}

async function handleDistributionExecution(key: string, distributionParams: any) {
  const { status, contractAddress, merkleTree } = distributionParams
  if (status !== DistributionStatus.StartDistribution) {
    return
  }
  if (!contractAddress || !merkleTree) {
    console.error(
      'contractAddress and merkleTree are mandatory to distribute rewards. Soemthing went wrong'
    )
    return
  }

  await updateDistributionStatus(key, DistributionStatus.Distributing)
  await distributeRewards(contractAddress, merkleTree)
  await updateDistributionStatus(key, DistributionStatus.Done)
}

async function initializeFirebaseDb() {
  admin
    .database()
    .ref('/rewardDistributions')
    .on(
      'child_added',
      async (snapshot) => {
        const distributionParams = snapshot && snapshot.val()
        if (!distributionParams || !snapshot.key) {
          console.error(
            'No distribution params or snapshot key found',
            distributionParams,
            snapshot.key
          )
          return
        }
        console.debug('New distribution info fetched: ', distributionParams)
        await handleNewDistribution(snapshot.key, distributionParams)
      },
      (error: any) => {
        console.error('Error reading rewards data:', error.code)
      }
    )
  admin
    .database()
    .ref('/rewardDistributions')
    .on(
      'child_changed',
      async (snapshot) => {
        const distributionParams = snapshot && snapshot.val()
        if (!distributionParams || !snapshot.key) {
          console.error(
            'No distribution params or snapshot key found',
            distributionParams,
            snapshot.key
          )
          return
        }
        console.debug('Distribution info changed: ', distributionParams)
        await handleDistributionExecution(snapshot.key, distributionParams)
      },
      (error: any) => {
        console.error('Error reading rewards data:', error.code)
      }
    )

  await sleep(5000)
  await handleNewDistribution('test', {
    fromBlock: 8178075,
    toBlock: 8299034,
    status: DistributionStatus.Pending,
    skipDistribution: false,
  })
  // await handleDistributionExecution('2021-08-16', {
  //   status: DistributionStatus.StartDistribution,
  //   contractAddress: '0xcC324F91CaeBD967C1589741B4bAAfe27D750456',
  //   merkleRoot: '0xf36f3bb17c7352a1acee6b15e0eb48c9ad761347d739c9ca0a4deaa4cd7410a9',
  //   tokenAddress: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
  //   totalRewards: '651776179135450996764',
  //   rewardsByAddress: '1629141417261/rewardsByAddress.json',
  //   merkleTree: '1629141417261/merkleTree.json',
  //   fromBlock: 8178075,
  //   toBlock: 8299034,
  // })
}
