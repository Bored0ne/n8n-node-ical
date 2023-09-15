import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import * as ICAL from 'node-ical';

export class IcsNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'ICS',
		name: 'icsNode',
		group: ['transform'],
		version: 1,
		description: 'Converts a string of ICS data into an array of json objects',
		defaults: {
			name: 'ICS',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			// Node properties which the user gets displayed and
			// can change on the node.
			{
				displayName: 'ICS Raw Data',
				name: 'icsRaw',
				type: 'string',
				default: '',
				placeholder: 'Raw ICS data',
				description: 'This is the raw ICS data',
			},
		],
	};

	// The function below is responsible for actually doing whatever this node
	// is supposed to do. In this case, we're just appending the `myString` property
	// with whatever the user has entered.
	// You can make async calls and use `await`.
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		let item: INodeExecutionData;
		let icsRaw: string;

		// Iterates over all input items and add the key "myString" with the
		// value the parameter "myString" resolves to.
		// (This could be a different value for each item in case it contains an expression)
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				icsRaw = this.getNodeParameter('icsRaw', itemIndex, '') as string;
				item = items[itemIndex];

				const jsonICS = await ICAL.async.parseICS(icsRaw);
				item.json['ics'] = Object.keys(jsonICS)
					.map((key) => {
						const obj = jsonICS[key];
						let alarms: any[] = [];
						Object.keys(obj).forEach((subObjectKey) => {
							// @ts-ignore
							if (obj?.[subObjectKey]?.type == 'VALARM') {
								// @ts-ignore
								alarms.push({ ...obj[subObjectKey], id: subObjectKey });
								// @ts-ignore
								delete obj[subObjectKey];
							}
						});
						return { ...obj, id: key, alarms };
					})
					.filter((obj) => obj?.type == 'VEVENT');
			} catch (error) {
				// This node should never fail but we want to showcase how
				// to handle errors.
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
				} else {
					// Adding `itemIndex` allows other workflows to handle this error
					if (error.context) {
						// If the error thrown already contains the context property,
						// only append the itemIndex
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return this.prepareOutputData(items);
	}
}
