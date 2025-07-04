import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";

const ecsClient = new ECSClient();

const CLUSTER = process.env.ECS_CLUSTER;
const TASK_DEFINITION = process.env.ECS_TASK_DEFINITION;
const SUBNETS = process.env.SUBNETS.split(",");
const SECURITY_GROUP = process.env.SECURITY_GROUP;

export const handler = async (event) => {
  console.log("Received SQS event:", JSON.stringify(event));

  for (const record of event.Records) {
    const body = JSON.parse(record.body);
    console.log("Processing SQS message:", body);

    const environmentOverrides = Object.entries(body).map(([key, value]) => ({
      name: key.toUpperCase(),
      value: String(value),
    }));

    const runTaskParams = {
      cluster: CLUSTER,
      taskDefinition: TASK_DEFINITION,
      launchType: "FARGATE",
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: SUBNETS,
          securityGroups: [SECURITY_GROUP],
          assignPublicIp: "ENABLED",
        },
      },
      overrides: {
        containerOverrides: [
          {
            name: "safetube-processor",
            environment: environmentOverrides,
          },
        ],
      },
    };

    console.log("Running ECS Task with params:", JSON.stringify(runTaskParams));

    await ecsClient.send(new RunTaskCommand(runTaskParams));
  }

  return {
    statusCode: 200,
    body: "Successfully triggered ECS tasks for all messages.",
  };
};
