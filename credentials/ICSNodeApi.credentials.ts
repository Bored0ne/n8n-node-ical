import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class ICSNodeApi implements ICredentialType {
	name = 'icsNodeApi';
	displayName = 'ICS Node API';
	documentationUrl = 'https://github.com/Bored0ne/n8n-nodes-ical';
	properties: INodeProperties[] = [];
}
